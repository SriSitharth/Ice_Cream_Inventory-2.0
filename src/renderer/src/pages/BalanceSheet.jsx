import React, { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Statistic,
  Table,
  Modal,
  List,
  message,
  Radio,
  Input,
  DatePicker,
  Form,
  Tag,
  Select,
  InputNumber
} from 'antd'
// import { getCustomerPayDetailsById } from '../firebase/data-tables/customer'
// import { getFreezerboxById } from '../firebase/data-tables/freezerbox'
import { LuFileCog } from 'react-icons/lu'
import { PiExport } from 'react-icons/pi'
import { TimestampJs } from '../js-files/time-stamp'
import { FaBackward, FaForward } from 'react-icons/fa'
import { generatPDF } from '../js-files/pdf-generator'
import { addDoc, collection, doc, getDocs, getDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import companyLogo from '../assets/img/companylogo.png'
import dayjs from 'dayjs'
import './css/BalanceSheet.css'
const { Search } = Input

import { addCustomerPayment, getCustomerById, getCustomerPaymentsById } from '../sql/customer'
import { getFreezerboxById, getFreezerboxByCustomerId } from '../sql/freezerbox'

export default function BalanceSheet({ datas }) {
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const [deliveryData, setDeliveryData] = useState([])
  const [balanceTbLoading, setBalanceTbLoading] = useState(true)
  const [filteredData, setFilteredData] = useState([])
  const [deliveryList, setDeliveryList] = useState([])
  const [payDetailsList, setPayDetailsList] = useState([])
  const [activeCard, setActiveCard] = useState(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [customerPayId, setCustomerPayId] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [refreshTable, setRefreshTable] = useState(false)
  const [isOpenDisabled, setIsOpenDisabled] = useState(false)
  const [isCloseDisabled, setIsCloseDisabled] = useState(false)
  const [isPayDisabled, setIsPayDisabled] = useState(false)
  const [isPaySelected, setIsPaySelected] = useState(false)
  const printRef = useRef()
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [prevBookExists, setPrevBookExists] = useState(false)
  const [nextBookExists, setNextBookExists] = useState(false)
  const [isFreezerBoxCustomer, setIsFreezerBoxCustomer] = useState(false)
  const [freezerBoxOptions, setFreezerBoxOptions] = useState([])
  const [selectedBoxId, setSelectedBoxId] = useState(null)
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0)
  const [totalBookIndex, setTotalBookIndex] = useState(0)

  const fetchData = async () => {
    setBalanceTbLoading(true)
    const initialData = await Promise.all(
      datas.customers
        .filter((data) => data.isDeleted === 0)
        .map(async (item, index) => {
          const customerDeliveries = (datas.delivery || []).filter(
            (delivery) => delivery.customerId === item.id && !delivery.isDeleted
          )

          const payDetailsResponse = await getCustomerPaymentsById(item.id)
          let payDetails = []
          if (payDetailsResponse) {
            payDetails = payDetailsResponse
          }

          const openEntry = payDetails
            .filter((payDetail) => payDetail.decription === 'Open')
            .sort(
              (a, b) =>
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )[0]

          const isOpenOrClose = payDetails
            .filter(
              (payDetail) => payDetail.decription === 'Open' || payDetail.decription === 'Close'
            )
            .sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )[0]

          if (!isOpenOrClose) {
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              balance: 0,
              bookstatus: 'Empty'
            }
          }

          const filteredPayDetails = openEntry
            ? [
                openEntry,
                ...payDetails.filter((payDetail) =>
                  dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                    dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                  )
                )
              ]
            : payDetails

          const filteredDeliveries = openEntry
            ? customerDeliveries.filter((delivery) =>
                dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                  dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            : customerDeliveries

          const billUnpaid = filteredDeliveries.reduce((acc, item) => {
            if (item.paymentstatus === 'Unpaid' && item.type === 'order') {
              return acc + (Number(item.billamount) || 0)
            } else if (item.paymentstatus === 'Partial' && item.type === 'order') {
              return acc + (Number(item.billamount) - Number(item.partialamount) || 0)
            } else if (item.type === 'return') {
              return acc - (Number(item.billamount) || 0)
            }
            return acc
          }, 0)

          const totalPayment = filteredPayDetails.reduce((acc, item) => {
            return item.type === 'Payment' ? acc + Number(item.amount) : acc
          }, 0)

          const balance = openEntry.amount + billUnpaid - totalPayment

          return {
            ...item,
            sno: index + 1,
            key: item.id || index,
            balance: balance,
            bookstatus: isOpenOrClose.decription
          }
        })
    )
    setData(initialData)
    setFilteredData(initialData)
    setBalanceTbLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [refreshTable, datas])

  const reloadTable = () => {
    setRefreshTable((prev) => !prev)
  }

  useEffect(() => {
    const fetchData = async () => {
      setBalanceTbLoading(true)
      const filteredData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isDeleted)
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerId)
            const customerName = result.name || item.name
            const mobileNumber = result.mobileNumber || item.mobileNumber
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              name: customerName,
              mobileNumber: mobileNumber
            }
          })
      )
      setDeliveryData(filteredData)
      setBalanceTbLoading(false)
    }
    fetchData()
  }, [datas])

  // search
  const [searchText, setSearchText] = useState('')
  const onSearchEnter = (value, _e) => {
    setSearchText(value.trim())
  }
  const onSearchChange = (e) => {
    if (e.target.value === '') {
      setSearchText('')
    }
  }

  const columns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50,
      filteredValue: [searchText],
      render: (_, __, index) => index + 1,
      onFilter: (value, record) => {
        return (
          String(record.name).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobileNumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.balance).toLowerCase().includes(value.toLowerCase()) ||
          String(record.bookstatus).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      width: 100
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      render: (balance) => {
        const numericBalance = typeof balance === 'number' ? balance : 0
        return `${numericBalance.toFixed(2)}`
      },
      sorter: (a, b) => a.balance - b.balance
    },
    {
      title: 'Status',
      dataIndex: 'bookstatus',
      key: 'bookstatus',
      width: 80,
      sorter: (a, b) => a.bookstatus.localeCompare(b.bookstatus),
      render: (text) => <Tag color={text === 'Open' ? 'green' : 'red'}>{text}</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 70,
      render: (_, record) => (
        <span>
          <Button onClick={() => showPayModel(record)} className="h-[1.7rem]">
            <LuFileCog />
          </Button>
        </span>
      )
    }
  ]

  const showPayModel = async (record) => {
    payForm.resetFields()
    setCustomerPayId(record.id)
    try {
      const payDetailsResponse = await getCustomerPaymentsById(record.id)
      if (payDetailsResponse) {
        const payDetails = payDetailsResponse || []
        const isOpenOrClose = payDetails
          .filter(
            (payDetail) => payDetail.decription === 'Open' || payDetail.decription === 'Close'
          )
          .sort((a, b) =>
            dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
              dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          )[0]
        if (isOpenOrClose) {
          setIsOpenDisabled(isOpenOrClose.decription === 'Open')
          setIsCloseDisabled(isOpenOrClose.decription === 'Close')
          setIsPayDisabled(isOpenOrClose.decription === 'Close')
          setIsModalVisible(false)
          payForm.setFieldsValue({
            decription: isOpenOrClose.decription === 'Open' ? 'Close' : 'Open'
          })
        } else {
          setIsOpenDisabled(false)
          setIsCloseDisabled(true)
          setIsPayDisabled(true)
          setIsModalVisible(false)
          payForm.setFieldsValue({ decription: 'Open' })
        }
      } else {
        console.error(payDetailsResponse)
      }
      setIsModalVisible(true)
    } catch (err) {
      console.error('Error fetching pay details:', err)
    }
  }

  const balancesheetPay = async (value) => {
    let { date, amount, decription, paymentMode, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const type = decription === 'Pay' ? 'Payment' : 'Balance'
    const payData = {
      ...Datas,
      amount: Number(amount),
      date: new Date().toISOString(),
      type: type,
      paymentMode: decription === 'Pay' ? paymentMode : '',
      decription: decription,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      customerId: customerPayId,
      collectionType: decription === 'Pay' ? 'customer' : '',
      isDeleted: 0
    }
    try {
      // const customerDocRef = doc(db, 'customer', customerPayId)
      // const payDetailsRef = collection(customerDocRef, 'paydetails')
      // await addDoc(payDetailsRef, payData)
      await addCustomerPayment(payData)
      message.open({ type: 'success', content: 'Book Status Added Successfully' })
      reloadTable()
    } catch (e) {
      console.log(e)
      message.open({ type: 'error', content: `${e} Book Status Added Unsuccessfully` })
    } finally {
      payForm.resetFields()
      fetchCustomerData(customerPayId)
      setCustomerPayId(null)
      setActiveCard(null)
      setIsModalVisible(false)
    }
  }

  const totalSelf = data.filter((item) => item.transport === 'Self').length
  const totalCompany = data.filter((item) => item.transport === 'Company').length
  const totalFreezerBox = data.filter((item) => item.transport === 'Freezer Box').length
  const totalMiniBox = data.filter((item) => item.transport === 'Mini Box').length

  const filterData = (transportType) => {
    const filtered = data.filter((item) => item.transport === transportType)
    setFilteredData(filtered)
  }

  const handleRowClick = async (record) => {
    setFreezerBoxOptions([])
    setSelectedBoxId(null)
    fetchCustomerData(record.id)
    setSelectedCustomer(record.id)
    setCurrentEntryIndex(0)
    if (record.transport === 'Freezer Box') {
      const result = await getFreezerboxByCustomerId(record.id)
      if (result) {
        const options = result.map((box) => ({
          value: box.id,
          label: box.boxNumber
        }))
        setFreezerBoxOptions(options)
        setIsFreezerBoxCustomer(true)
      } else {
        setFreezerBoxOptions([])
        setIsFreezerBoxCustomer(false)
        console.error(result)
      }
    } else {
      setIsFreezerBoxCustomer(false)
      setFreezerBoxOptions([])
    }
  }

  const handleBoxChange = async (value) => {
    console.log(selectedCustomer, value)
    setSelectedBoxId(value)
    if (!value) {
      await fetchCustomerDataByBoxID(selectedCustomer, '')
    } else {
      await fetchCustomerDataByBoxID(selectedCustomer, value)
    }
  }

  const fetchCustomerDataByBoxID = async (customerId, boxid) => {
    try {
      const customerResponse = await getCustomerById(customerId)
      if (customerResponse) {
        setCustomerName(customerResponse.name)
      } else {
        console.error(customerResponse)
        return
      }

      const payDetailsResponse = await getCustomerPaymentsById(customerId)
      if (payDetailsResponse) {
        const payDetails = payDetailsResponse || []

        const opencloseEntries = payDetails
          .filter(
            (payDetails) => payDetails.decription === 'Open' || payDetails.decription === 'Close'
          )
          .sort((a, b) =>
            dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          )

        let totalPairs = 0
        let openCount = 0

        opencloseEntries.forEach((entry) => {
          if (entry.decription === 'Open') {
            openCount++
          } else if (entry.decription === 'Close' && openCount > 0) {
            totalPairs++
            console.log(`Pair formed: totalPairs = ${totalPairs}`)
            openCount--
          }
        })
        if (
          opencloseEntries.length > 3 &&
          opencloseEntries[opencloseEntries.length - 1].decription === 'Close'
        ) {
          totalPairs = totalPairs - 1
        }
        // setCurrentEntryIndex(totalPairs)
        setTotalBookIndex(totalPairs)

        setPrevBookExists(currentEntryIndex > 0)
        setNextBookExists(currentEntryIndex < totalPairs)

        const openEntry =
          payDetails
            .filter((payDetail) => payDetail.decription === 'Open')
            .sort((a, b) =>
              dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )[currentEntryIndex] || null

        const closeEntry =
          payDetails
            .filter((payDetail) => payDetail.decription === 'Close')
            .sort((a, b) =>
              dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )[currentEntryIndex] || null

        let filteredPayDetails = []

        if (openEntry) {
          if (closeEntry) {
            const isCloseAfterOpen = dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
              dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
            if (isCloseAfterOpen) {
              filteredPayDetails = payDetails.filter((payDetail) => {
                const payDate = dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss')
                return (
                  payDate.isAfter(dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')) &&
                  payDate.isBefore(dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss'))
                )
              })
              filteredPayDetails = [openEntry, ...filteredPayDetails, closeEntry]
              filteredPayDetails.sort(
                (a, b) =>
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                  dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            } else {
              filteredPayDetails = [
                openEntry,
                ...payDetails.filter((payDetail) =>
                  dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                    dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                  )
                )
              ]
              filteredPayDetails.sort(
                (a, b) =>
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                  dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            }
          } else {
            filteredPayDetails = [
              openEntry,
              ...payDetails.filter((payDetail) =>
                dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                  dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            ]
            filteredPayDetails.sort(
              (a, b) =>
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          }
        }

        setPayDetailsList(filteredPayDetails)

        const deliveries = await Promise.all(
          deliveryData
            .filter((delivery) => {
              const matchesCustomer = delivery.customerId === customerId
              const matchesBox = boxid ? delivery.boxid === boxid : true
              return matchesCustomer && !delivery.isDeleted && matchesBox
            })
            .map(async (delivery) => {
              const freezerbox = await getFreezerboxById(delivery.boxid)
              return {
                ...delivery,
                boxNumber: freezerbox === undefined ? '' : freezerbox.boxNumber
              }
            })
        )

        let filteredDeliveries = []

        if (openEntry) {
          if (closeEntry) {
            const isCloseAfterOpen = dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
              dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
            if (isCloseAfterOpen) {
              filteredDeliveries = deliveries.filter((delivery) => {
                const deliveryDate = dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss')
                return (
                  deliveryDate.isAfter(dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')) &&
                  deliveryDate.isBefore(dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss'))
                )
              })
              filteredDeliveries.sort((a, b) =>
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            } else {
              filteredDeliveries = deliveries.filter((delivery) =>
                dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                  dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
              filteredDeliveries.sort((a, b) =>
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            }
          } else {
            filteredDeliveries = deliveries.filter((delivery) =>
              dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
            filteredDeliveries.sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
          }
        }
        setDeliveryList(filteredDeliveries)
      } else {
        console.error(payDetailsResponse)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const fetchCustomerData = async (customerId) => {
    try {
      const customerResponse = await getCustomerById(customerId)
      if (customerResponse) {
        setCustomerName(customerResponse.name)
      } else {
        console.error(customerResponse)
        return
      }

      const payDetailsResponse = await getCustomerPaymentsById(customerId)
      if (payDetailsResponse) {
        const payDetails = payDetailsResponse || []

        const opencloseEntries = payDetails
          .filter(
            (payDetails) => payDetails.decription === 'Open' || payDetails.decription === 'Close'
          )
          .sort((a, b) =>
            dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          )

        let totalPairs = 0
        let openCount = 0

        opencloseEntries.forEach((entry) => {
          if (entry.decription === 'Open') {
            openCount++
          } else if (entry.decription === 'Close' && openCount > 0) {
            totalPairs++
            console.log(`Pair formed: totalPairs = ${totalPairs}`)
            openCount--
          }
        })
        if (
          opencloseEntries.length > 3 &&
          opencloseEntries[opencloseEntries.length - 1].decription === 'Close'
        ) {
          totalPairs = totalPairs - 1
        }
        setCurrentEntryIndex(totalPairs)
        setTotalBookIndex(totalPairs)

        if (opencloseEntries.length > 0) {
          if (opencloseEntries[opencloseEntries.length - 1].decription === 'Open') {
            if (opencloseEntries.length > 1) {
              setPrevBookExists(true)
              setNextBookExists(false)
            } else {
              setPrevBookExists(false)
              setNextBookExists(false)
            }
          } else {
            if (opencloseEntries.length > 2) {
              setPrevBookExists(true)
              setNextBookExists(false)
            } else {
              setPrevBookExists(false)
              setNextBookExists(false)
            }
          }
        } else {
          setPrevBookExists(false)
          setNextBookExists(false)
        }

        const openEntry =
          payDetails
            .filter((payDetail) => payDetail.decription === 'Open')
            .sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )[0] || null

        const closeEntry =
          payDetails
            .filter((payDetail) => payDetail.decription === 'Close')
            .sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )[0] || null

        let filteredPayDetails = []

        if (openEntry) {
          if (closeEntry) {
            const isCloseAfterOpen = dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
              dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
            if (isCloseAfterOpen) {
              filteredPayDetails = payDetails.filter((payDetail) => {
                const payDate = dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss')
                return (
                  payDate.isAfter(dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')) &&
                  payDate.isBefore(dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss'))
                )
              })
              filteredPayDetails = [openEntry, ...filteredPayDetails, closeEntry]
              filteredPayDetails.sort(
                (a, b) =>
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                  dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            } else {
              filteredPayDetails = [
                openEntry,
                ...payDetails.filter((payDetail) =>
                  dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                    dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                  )
                )
              ]
              filteredPayDetails.sort(
                (a, b) =>
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                  dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            }
          } else {
            filteredPayDetails = [
              openEntry,
              ...payDetails.filter((payDetail) =>
                dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                  dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            ]
            filteredPayDetails.sort(
              (a, b) =>
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          }
        }

        setPayDetailsList(filteredPayDetails)

        const deliveries = await Promise.all(
          deliveryData
            .filter((delivery) => delivery.customerId === customerId && !delivery.isDeleted)
            .map(async (delivery) => {
              const freezerbox = await getFreezerboxById(delivery.boxid)
              return {
                ...delivery,
                boxNumber: freezerbox === undefined ? '' : freezerbox.boxNumber
              }
            })
        )

        let filteredDeliveries = []

        if (openEntry) {
          if (closeEntry) {
            const isCloseAfterOpen = dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
              dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
            if (isCloseAfterOpen) {
              filteredDeliveries = deliveries.filter((delivery) => {
                const deliveryDate = dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss')
                return (
                  deliveryDate.isAfter(dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')) &&
                  deliveryDate.isBefore(dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss'))
                )
              })
              filteredDeliveries.sort((a, b) =>
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            } else {
              filteredDeliveries = deliveries.filter((delivery) =>
                dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                  dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
              filteredDeliveries.sort((a, b) =>
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                  dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            }
          } else {
            filteredDeliveries = deliveries.filter((delivery) =>
              dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
            filteredDeliveries.sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
          }
        }
        setDeliveryList(filteredDeliveries)
      } else {
        console.error(payDetailsResponse)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const handlePrevClick = async () => {
    if (prevBookExists) {
      setCurrentEntryIndex((prevIndex) => {
        const newIndex = Math.max(prevIndex - 1, 0)
        setNextBookExists(true)
        if (newIndex === 0) {
          setPrevBookExists(false)
        }
        return newIndex
      })
      await loadListEntriesAtIndex(currentEntryIndex - 1)
    }
  }

  const handleNextClick = async () => {
    if (nextBookExists) {
      setCurrentEntryIndex((prevIndex) => {
        const newIndex = Math.max(prevIndex + 1, 0)
        setPrevBookExists(true)
        if (newIndex >= totalBookIndex) {
          setNextBookExists(false)
        }
        return newIndex
      })
      await loadListEntriesAtIndex(currentEntryIndex + 1)
    }
  }

  const loadListEntriesAtIndex = async (index) => {
    let payDetails = []
    const payDetailsResponse = await getCustomerPaymentsById(selectedCustomer)
    if (payDetailsResponse) {
      payDetails = payDetailsResponse || []
    }

    const opencEntry =
      payDetails
        .filter((payDetail) => payDetail.decription === 'Open')
        .sort((a, b) =>
          dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
            dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
          )
        )[index] || null

    const closeEntry =
      payDetails
        .filter((payDetail) => payDetail.decription === 'Close')
        .sort((a, b) =>
          dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
            dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
          )
        )[index] || null

    await loadListEntries(opencEntry, closeEntry)
  }

  const loadListEntries = async (openEntry, closeEntry) => {
    try {
      let payDetails = []
      const payDetailsResponse = await getCustomerPaymentsById(selectedCustomer)
      if (payDetailsResponse) {
        payDetails = payDetailsResponse || []
      }

      let filteredPayDetails = []
      if (openEntry) {
        if (closeEntry) {
          const isCloseAfterOpen = dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
            dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
          )
          if (isCloseAfterOpen) {
            filteredPayDetails = payDetails.filter((payDetail) => {
              const payDate = dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss')
              return (
                payDate.isAfter(dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')) &&
                payDate.isBefore(dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss'))
              )
            })
            filteredPayDetails = [openEntry, ...filteredPayDetails, closeEntry]
            filteredPayDetails.sort(
              (a, b) =>
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          } else {
            filteredPayDetails = [
              openEntry,
              ...payDetails.filter((payDetail) =>
                dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                  dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
                )
              )
            ]
            filteredPayDetails.sort(
              (a, b) =>
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
                dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          }
        } else {
          filteredPayDetails = [
            openEntry,
            ...payDetails.filter((payDetail) =>
              dayjs(payDetail.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
          ]
          filteredPayDetails.sort(
            (a, b) =>
              dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss') -
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss')
          )
        }
      }

      setPayDetailsList(filteredPayDetails)

      const deliveries = await Promise.all(
        deliveryData
          .filter((delivery) => {
            const isMatchingCustomer =
              delivery.customerId === selectedCustomer && !delivery.isDeleted
            const isMatchingBox = !selectedBoxId || delivery.boxid === selectedBoxId
            return isMatchingCustomer && isMatchingBox
          })
          .map(async (delivery) => {
            const freezerbox = await getFreezerboxById(delivery.boxid)
            return {
              ...delivery,
              boxNumber: freezerbox === undefined ? '' : freezerbox.boxNumber
            }
          })
      )

      let filteredDeliveries = []

      if (openEntry) {
        if (closeEntry) {
          const isCloseAfterOpen = dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
            dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
          )
          if (isCloseAfterOpen) {
            filteredDeliveries = deliveries.filter((delivery) => {
              const deliveryDate = dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss')
              return (
                deliveryDate.isAfter(dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')) &&
                deliveryDate.isBefore(dayjs(closeEntry.createdDate, 'DD/MM/YYYY HH:mm:ss'))
              )
            })
            filteredDeliveries.sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
          } else {
            filteredDeliveries = deliveries.filter((delivery) =>
              dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
                dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
            filteredDeliveries.sort((a, b) =>
              dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
                dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
              )
            )
          }
        } else {
          filteredDeliveries = deliveries.filter((delivery) =>
            dayjs(delivery.createdDate, 'DD/MM/YYYY HH:mm:ss').isAfter(
              dayjs(openEntry.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          )
          filteredDeliveries.sort((a, b) =>
            dayjs(b.createdDate, 'DD/MM/YYYY HH:mm:ss').diff(
              dayjs(a.createdDate, 'DD/MM/YYYY HH:mm:ss')
            )
          )
        }
      }
      setDeliveryList(filteredDeliveries)
    } catch (error) {
      console.log('Error', error.message)
    }
  }

  const handleExportClick = async () => {
    await generatPDF(printRef, `${customerName}-${TimestampJs()}`)
  }

  const totalOrderAmount = deliveryList
    .filter((product) => product.type === 'order')
    .reduce((total, product) => total + product.total, 0)

  const totalReturnAmount = deliveryList
    .filter((product) => product.type === 'return')
    .reduce((total, product) => total + product.total, 0)

  const totalMRP = deliveryList.reduce((acc, item) => {
    if (item.type === 'return') {
      return acc - (Number(item.total) || 0)
    }
    return acc + (Number(item.total) || 0)
  }, 0)

  const totalBilled = deliveryList.reduce((acc, item) => {
    if (item.type === 'return') {
      return acc - (Number(item.billamount) || 0)
    }
    return acc + (Number(item.billamount) || 0)
  }, 0)

  const billPaid = deliveryList.reduce((acc, item) => {
    if (item.paymentstatus === 'Paid' && item.type === 'order') {
      return acc + (Number(item.billamount) || 0)
    } else if (item.paymentstatus === 'Partial' && item.type === 'order') {
      return acc + (Number(item.partialamount) || 0)
    }
    return acc
  }, 0)

  const billUnpaid = deliveryList.reduce((acc, item) => {
    if (item.paymentstatus === 'Unpaid' && item.type === 'order') {
      return acc + (Number(item.billamount) || 0)
    } else if (item.paymentstatus === 'Partial' && item.type === 'order') {
      return acc + (Number(item.billamount) - Number(item.partialamount) || 0)
    } else if (item.type === 'return') {
      return acc - (Number(item.billamount) || 0)
    }
    return acc
  }, 0)

  const totalPayment = payDetailsList.reduce((acc, item) => {
    return item.type === 'Payment' ? acc + Number(item.amount) : acc
  }, 0)

  const totalCustomerSpend = payDetailsList.reduce((acc, item) => {
    return item.type === 'Spend' ? acc + Number(item.amount) : acc
  }, 0)

  const totalCustomerAdvance = payDetailsList.reduce((acc, item) => {
    return item.type === 'Advance' ? acc + Number(item.amount) : acc
  }, 0)

  const openingBalance = payDetailsList.reduce((acc, item) => {
    if (item.type === 'Balance' && item.decription === 'Open') {
      return acc + item.amount
    }
    return acc
  }, 0)

  const handleCardClick = (key) => {
    setActiveCard(key)
    filterData(key)
  }

  const cardsData = [
    { key: 'Self', title: 'Self', value: totalSelf },
    { key: 'Company', title: 'Company', value: totalCompany },
    { key: 'Freezer Box', title: 'Freezer Box', value: totalFreezerBox },
    { key: 'Mini Box', title: 'Mini Box', value: totalMiniBox }
  ]

  // Table Height Auto Adjustment (***Do not touch this code***)
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 200 // Adjust this value based on your layout needs
      setTableHeight(newHeight)
    }
    // Set initial height
    updateTableHeight()
    // Update height on resize and fullscreen change
    window.addEventListener('resize', updateTableHeight)
    document.addEventListener('fullscreenchange', updateTableHeight)
    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('resize', updateTableHeight)
      document.removeEventListener('fullscreenchange', updateTableHeight)
    }
  }, [])

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 justify-between items-center">
          <Search
            allowClear
            className="w-[30%]"
            placeholder="Search"
            onSearch={onSearchEnter}
            onChange={onSearchChange}
            enterButton
          />
          <div className="flex gap-x-2">
            <Select
              className="box-select"
              showSearch
              allowClear
              disabled={!isFreezerBoxCustomer}
              placeholder={
                <span
                  style={{
                    color: isFreezerBoxCustomer ? '#f26723' : ''
                  }}
                >
                  Select Box
                </span>
              }
              style={{
                width: 120,
                color: '#f26723'
              }}
              value={selectedBoxId}
              onChange={handleBoxChange}
              options={freezerBoxOptions}
            />

            <Button type="primary" disabled={!deliveryList.length} onClick={handleExportClick}>
              <PiExport />
              Export
            </Button>
            <Button type="primary" disabled={!prevBookExists} onClick={handlePrevClick}>
              <FaBackward />
              Prev
            </Button>
            <Button type="primary" disabled={!nextBookExists} onClick={handleNextClick}>
              Next
              <FaForward />
            </Button>
          </div>
        </li>
        <li className="card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2">
          {cardsData.map((card) => {
            const isActive = activeCard === card.key
            return (
              <Card
                key={card.key}
                onClick={() => handleCardClick(card.key)}
                style={{
                  cursor: 'pointer',
                  borderColor: isActive ? '#f26723' : '#aaa',
                  borderWidth: 2,
                  background: isActive ? '#f26723' : '',
                  color: isActive ? '#ffffff' : ''
                }}
              >
                <Statistic
                  title={
                    isActive ? (
                      <span className="text-white font-semibold">{card.title}</span>
                    ) : (
                      <span className="font-semibold">{card.title}</span>
                    )
                  }
                  value={card.value}
                  valueStyle={{
                    color: isActive ? '#ffffff' : '#f26723'
                  }}
                  prefix={card.prefix}
                />
              </Card>
            )
          })}
        </li>
        <li className="flex space-x-2 mt-2">
          <div className="w-1/2 pr-2 border border-gray-300 rounded-lg">
            <Table
              virtual
              pagination={false}
              columns={columns}
              dataSource={filteredData}
              loading={balanceTbLoading}
              rowKey="id"
              scroll={{ y: tableHeight }}
              onRow={(record) => ({
                onClick: () => handleRowClick(record)
              })}
            />
          </div>
          <div className="w-1/2 pl-2 border border-gray-300 rounded-lg p-4">
            <List
              size="small"
              header={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Order Details {customerName}</div>
                  <div>Order: {totalOrderAmount.toFixed(2)}</div>
                  <div>Return: {totalReturnAmount.toFixed(2)}</div>
                </div>
              }
              footer={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>MRP: {totalMRP.toFixed(2)}</div>
                  <div>Billed: {totalBilled.toFixed(2)}</div>
                  <div>Paid: {billPaid.toFixed(2)}</div>
                  <div>Unpaid: {billUnpaid.toFixed(2)}</div>
                </div>
              }
              bordered
              dataSource={deliveryList}
              renderItem={(item) => (
                <List.Item>
                  <div>{item.date}</div>
                  <div>
                    MRP: <Tag color="blue">{item.total}</Tag>
                  </div>
                  <div>
                    Bill: <Tag color="green">{item.billamount}</Tag>
                  </div>
                  <div>
                    {item.paymentstatus === 'Partial' ? (
                      <span>
                        {item.paymentstatus}: <Tag color="orange">{item.partialamount}</Tag>
                      </span>
                    ) : (
                      <span>{item.paymentstatus}</span>
                    )}
                  </div>
                  <div>
                    {item.type}
                    {item.boxNumber ? <Tag>{item.boxNumber}</Tag> : ''}
                  </div>
                </List.Item>
              )}
              style={{
                maxHeight: `${tableHeight / 2}px`,
                overflowY: 'auto'
              }}
            />
            <List
              className="mt-2"
              size="small"
              header={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Payment Details {customerName}</div>
                  <div>Total Spend: {totalCustomerSpend}</div>
                  <div>Total Advance: {totalCustomerAdvance}</div>
                </div>
              }
              footer={
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}
                >
                  <div>Open Balance: {openingBalance}</div>
                  <div>Total Payment: {totalPayment.toFixed(2)}</div>
                  <div>Book Balance: {(billUnpaid - totalPayment).toFixed(2)}</div>
                </div>
              }
              bordered
              dataSource={payDetailsList}
              renderItem={(item) => (
                <List.Item>
                  <div>{item.date}</div>
                  <div>
                    {item.type === 'Balance' ? (
                      <span>
                        Balance: <Tag color="blue">{item.amount}</Tag>
                      </span>
                    ) : item.type === 'Spend' ? (
                      <span>
                        Spend: <Tag color="red">{item.amount}</Tag>
                      </span>
                    ) : item.type === 'Advance' ? (
                      <span>
                        Advance: <Tag color="green">{item.amount}</Tag>
                      </span>
                    ) : (
                      <span>
                        Amount: <Tag color="purple">{item.amount}</Tag>
                      </span>
                    )}
                  </div>
                  <div>{item.decription}</div>
                </List.Item>
              )}
              style={{
                maxHeight: `${tableHeight / 2}px`,
                overflowY: 'auto'
              }}
            />
          </div>
        </li>
      </ul>

      <Modal
        title={<div className="flex justify-center">PAYMENT</div>}
        name="bookstatus"
        centered={true}
        open={isModalVisible}
        onOk={() => {
          payForm.submit()
        }}
        onCancel={() => {
          payForm.resetFields(), setIsPaySelected(false), setIsModalVisible(false)
        }}
      >
        <Form
          initialValues={{ date: dayjs(), paymentMode: 'Cash' }}
          layout="vertical"
          form={payForm}
          onFinish={balancesheetPay}
        >
          <Form.Item
            className=" absolute top-[0.75rem]"
            name="date"
            label=""
            rules={[{ required: true, message: false }]}
          >
            <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
          </Form.Item>
          <Form.Item
            name="decription"
            label="Book Status"
            rules={[{ required: true, message: false }]}
          >
            <Radio.Group
              buttonStyle="solid"
              style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
              onChange={(e) => {
                setIsPaySelected(e.target.value === 'Pay')
              }}
            >
              <Radio.Button value="Open" style={{ width: '33%' }} disabled={isOpenDisabled}>
                OPEN
              </Radio.Button>
              <Radio.Button value="Pay" style={{ width: '34%' }} disabled={isPayDisabled}>
                PAY
              </Radio.Button>
              <Radio.Button value="Close" style={{ width: '33%' }} disabled={isCloseDisabled}>
                CLOSE
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            className="mt-2"
            name="amount"
            label="Book Balance"
            rules={[{ required: true, message: false }]}
          >
            <InputNumber className="w-full" type="number" min={0} placeholder="Enter Amount" />
          </Form.Item>

          <Form.Item
            className="mb-0"
            name="paymentMode"
            label="Payment Mode"
            rules={[{ required: true, message: false }]}
          >
            <Radio.Group size="small" disabled={!isPaySelected}>
              <Radio value="Cash">Cash</Radio>
              <Radio value="Card">Card</Radio>
              <Radio value="UPI">UPI</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <div ref={printRef} className="absolute w-full top-[-200rem]">
        <section className="w-full max-w-[900px] mx-auto mt-1">
          <ul className="flex justify-center items-center gap-x-5">
            <li>
              <img className="w-[68px]" src={companyLogo} alt="comapanylogo" />{' '}
            </li>
            <li className="text-center">
              <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold' }} className="font-bold">
                NEW SARANYA ICE COMPANY
              </h1>{' '}
              <div style={{ fontWeight: 'bold' }}>
                <p>PILAVILAI, AZHAGANPARAI P.O.</p> <p>K.K.DIST</p>
              </div>
            </li>
          </ul>

          <ul className="mt-1 flex justify-between">
            <li>
              <div>
                <span className="font-bold">Date:</span> <span>{TimestampJs().split(',')[0]}</span>{' '}
              </div>
              <div>
                <span className="font-bold">GSTIN:</span> 33AAIFN6367K1ZV
              </div>
              <div>
                <span className="font-bold">Name:</span> <span>{customerName}</span>
              </div>
            </li>

            <li className="text-end flex flex-col items-end">
              <span>
                {' '}
                <span className="font-bold">Cell:</span> 7373674757
              </span>
              <span>9487369569</span>
            </li>
          </ul>

          <div className="grid grid-cols-2 gap-4 mt-4 w-[50%] mx-auto">
            <div className="flex justify-between">
              <p className="text-left font-bold">Order Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{totalOrderAmount}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Return Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{totalReturnAmount}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">MRP Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{totalMRP}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Margin Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{totalMRP - totalBilled}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Billed Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{totalBilled}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Paid Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{billPaid}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Unpaid Amount</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{billUnpaid}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Old Balance</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{openingBalance}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">Total Payments</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{totalPayment}</p>
            </div>

            <div className="flex justify-between">
              <p className="text-left font-bold">New Balance</p>
              <p className="text-center font-bold">:</p>
              <p className="text-right">{billUnpaid - totalPayment}</p>
            </div>
          </div>

          <div className="text-end mt-24">
            <p>Authorised Signature</p>
          </div>
        </section>
      </div>
    </div>
  )
}
