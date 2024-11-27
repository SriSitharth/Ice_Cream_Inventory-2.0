import React, { useState, useEffect, useRef } from 'react'
import { PrinterOutlined, DownloadOutlined, UnorderedListOutlined } from '@ant-design/icons'
import {
  Card,
  Statistic,
  DatePicker,
  Tag,
  Table,
  Typography,
  Button,
  Modal,
  Descriptions,
  Popconfirm,
  Form,
  message,
  Radio,
  Select,
  InputNumber,
  Input
} from 'antd'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { FaRupeeSign } from 'react-icons/fa'
import { FaRegFilePdf } from 'react-icons/fa6'
import { IoPerson } from 'react-icons/io5'
import { DatestampJs } from '../js-files/date-stamp'
import { fetchMaterials } from '../firebase/data-tables/rawmaterial'
import {
  getDeliveryById,
  fetchItemsForDelivery,
  getAllPayDetailsFromAllDelivery
  // getDeliveryUsingDates
} from '../firebase/data-tables/delivery'
import { getEmployeeById } from '../firebase/data-tables/employee'
import { getCustomerById } from '../firebase/data-tables/customer'
import { getSupplierById, getOneMaterialDetailsById } from '../firebase/data-tables/supplier'
import { jsPDF } from 'jspdf'
const { RangePicker } = DatePicker
import { debounce } from 'lodash'
import dayjs from 'dayjs'
import { TimestampJs } from '../js-files/time-stamp'
import companyLogo from '../assets/img/companylogo.png'
import { formatToRupee } from '../js-files/formate-to-rupee'
import html2canvas from 'html2canvas'
import ReactToPrint from 'react-to-print'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { AiOutlineDelete } from 'react-icons/ai'
import { customRound } from '../js-files/round-amount'
import WarningModal from '../components/WarningModal'
import { toDigit } from '../js-files/tow-digit'
import { getFreezerboxById } from '../firebase/data-tables/freezerbox'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import './css/Home.css'
import TableHeight from '../components/TableHeight'

// import { lastestFirstSort } from '../js-files/sort-time-date-sec'

dayjs.extend(isSameOrAfter)

export default function Home({ datas }) {
  const today = dayjs(DatestampJs(), 'DD/MM/YYYY')
  const [dateRange, setDateRange] = useState([today, today])
  const [filteredDelivery, setFilteredDelivery] = useState([])
  const [filteredRawmaterials, setFilteredRawmaterials] = useState([])
  const [filteredSpending, setFilteredSpending] = useState([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [selectedTableData, setSelectedTableData] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const [filteredPayments, setFilteredPayments] = useState([])
  const [filteredSpendingPayments, setFilteredSpendingPayments] = useState([])
  const [form] = Form.useForm()
  const [marginform] = Form.useForm()
  const [totalPayAmount, setTotalPayAmount] = useState(0)
  const [totalSpendAmount, setTotalSpendAmount] = useState(0)
  const [temform] = Form.useForm()
  const [quotationModalOpen, setQuotationModalOpen] = useState(false)
  const [deliveryData, setDeliveryData] = useState([])
  // const [quotationData, setQuotationData] = useState({
  //   date: dayjs(),
  //   type: 'withGST',
  //   productname: '',
  //   flavour: '',
  //   quantity: '',
  //   numberofpacks: 1
  // })

  const [quotationft, setQuotationFt] = useState({
    date: null,
    type: 'withGST',
    tempproduct: [],
    margin: 0,
    discount: 0,
    percentage: 0,
    amount: 0,
    count: 0,
    totalamount: 0,
    editingkey: '',
    mrpamount: 0,
    onfocus: false,
    edmargin: true,
    edprice: true,
    edpacks: true,
    customername: '',
    mobilenumber: ''
  })

  const quotationTempTable = [
    {
      title:<span className="text-[0.7rem]">S.No</span>,
      width:55,
      render:(text,record,i)=> <span className="text-[0.7rem]">{i+1}</span>
    },
    {
      title: <span className="text-[0.7rem]">Product</span>,
      dataIndex: 'productname',
      key: 'productname',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    // {
    //   title: <span className="text-[0.7rem]">Flavor</span>,
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   editable: false,
    //   render: (text) => <span className="text-[0.7rem]">{text}</span>
    // },
    // {
    //   title: <span className="text-[0.7rem]">Quantity</span>,
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   editable: false,
    //   render: (text) => <span className="text-[0.7rem]">{text}</span>
    // },
    {
      title: <span className="text-[0.7rem]">Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: quotationft.edpacks,
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width: 80
    },
    {
      title: <span className="text-[0.7rem]">Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width: 90
    },
    {
      title: <span className="text-[0.7rem]">MRP</span>,
      dataIndex: 'mrp',
      key: 'mrp',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      width: 100
    },
    {
      title: <span className="text-[0.7rem]">Margin</span>,
      dataIndex: 'margin',
      key: 'margin',
      editable: quotationft.edmargin,
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width: 80
    },
    {
      title: <span className="text-[0.7rem]">Price</span>,
      dataIndex: 'price',
      key: 'price',
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      editable: quotationft.edprice,
      width: 120
    },
    {
      title: <span className="text-[0.7rem]">Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        let iseditable = isEditionTemp(record)
        return !iseditable ? (
          <span className="flex gap-x-2">
            <MdOutlineModeEditOutline
              className="text-blue-500 cursor-pointer"
              size={19}
              onClick={() => temTbEdit(record)}
            />

            <Popconfirm
              className="cursor-pointer text-red-500 hover:text-red-400"
              // className={`${quotationft.editingkey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => removeTemProduct(record)}
              disabled={quotationft.editingkey !== ''}
            >
              <AiOutlineDelete
                // className={`${quotationft.editingkey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-2">
            <Typography.Link style={{ marginRight: 8 }} onClick={() => savedata(record)}>
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => {
                setStoreFirst(null)
                setQuotationFt((pre) => ({
                  ...pre,
                  editingkey: '',
                  edpacks: true,
                  edprice: true,
                  edmargin: true
                }))
              }}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const isEditionTemp = (re) => {
    return quotationft.editingkey.includes(re.key)
  }

  const tempMergedColumns = quotationTempTable.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'margin' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditionTemp(record)
      })
    }
  })
  const [storefirst, setStoreFirst] = useState(null)
  const temTbEdit = (re) => {
    temform.setFieldsValue({ ...re })
    setQuotationFt((pre) => ({
      ...pre,
      editingkey: [re.key],
      ediable: { margin: true, packs: true, price: true }
    }))
  }

  const EditableCellTem = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode =
      dataIndex === 'numberofpacks' ? (
        <InputNumber
          size="small"
          type="number"
          className="w-[4rem]"
          min={1}
          onFocus={(e) => {
            if (storefirst === null) {
              setStoreFirst(e.target.value)
              setQuotationFt((pre) => ({ ...pre, edmargin: false, edprice: false }))
            }
          }}
        />
      ) : dataIndex === 'margin' ? (
        <InputNumber
          type="number"
          onFocus={(e) => {
            if (storefirst === null) {
              setStoreFirst(e.target.value)
              setQuotationFt((pre) => ({ ...pre, edpacks: false, edprice: false }))
            }
          }}
          size="small"
          className="w-[4rem]"
          min={0}
          max={100}
        />
      ) : (
        <InputNumber
          onFocus={(e) => {
            if (storefirst === null) {
              setStoreFirst(e.target.value)
              setQuotationFt((pre) => ({ ...pre, edpacks: false, edmargin: false }))
            }
          }}
          size="small"
          className="w-[4rem]"
          min={0}
        />
      )
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{
              margin: 0
            }}
            rules={[
              {
                required: true,
                message: false
              }
            ]}
          >
            {inputNode}
          </Form.Item>
        ) : (
          children
        )}
      </td>
    )
  }

  const savedata = async (data) => {
    let row = temform.getFieldValue()
    try {
      if (
        data.numberofpacks === row.numberofpacks &&
        data.margin === row.margin &&
        data.price === row.price
      ) {
        message.open({ type: 'info', content: 'No changes made' })
      } else if (
        (data.numberofpacks !== row.numberofpacks &&
          data.margin === row.margin &&
          data.price === row.price) ||
        (data.numberofpacks === row.numberofpacks &&
          data.margin !== row.margin &&
          data.price === row.price)
      ) {
        // calculation
        let mrp = row.numberofpacks * data.productprice
        let updatedTempproduct = quotationft.tempproduct.map((product) =>
          product.key === row.key
            ? {
                ...product,
                numberofpacks: row.numberofpacks,
                margin: row.margin,
                price: customRound(mrp - (mrp * row.margin) / 100),
                mrp: mrp
              }
            : product
        )
        // update amount
        let totalamount = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpamount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        // Update the state with the new tempproduct array
        setQuotationFt((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          totalamount: totalamount,
          mrpamount: mrpamount
        }))
        message.open({ type: 'success', content: 'Updated Sucessfully' })
      } else if (
        data.numberofpacks === row.numberofpacks &&
        data.margin === row.margin &&
        data.price !== row.price
      ) {
        // calculation
        let mrp = row.numberofpacks * data.productprice
        let updatedTempproduct = quotationft.tempproduct.map((product) =>
          product.key === row.key
            ? {
                ...product,
                numberofpacks: row.numberofpacks,
                margin: customRound(((mrp - row.price) / mrp) * 100),
                price: row.price,
                mrp: mrp
              }
            : product
        )
        // update amount
        let totalamount = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpamount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        // Update the state with the new tempproduct array
        setQuotationFt((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          totalamount: totalamount,
          mrpamount: mrpamount
        }))
        message.open({ type: 'success', content: 'Updated Sucessfully' })
      }
    } catch (e) {
      console.log(e)
    } finally {
      setStoreFirst(null)
      setQuotationFt((pre) => ({
        ...pre,
        edpacks: true,
        edprice: true,
        edmargin: true,
        editingkey: ''
      }))
    }
  }

  const removeTemProduct = (recorde) => {
    const newTempProduct = quotationft.tempproduct.filter((item) => item.key !== recorde.key)
    newTempProduct.length <= 0
      ? setQuotationFt((pre) => ({ ...pre, count: 0, mrpamount: 0, totalamount: 0 }))
      : setQuotationFt((pre) => ({
          ...pre,
          totalamount: pre.totalamount - recorde.price,
          mrpamount: pre.mrpamount - recorde.mrp
        }))
    setQuotationFt((pre) => ({
      ...pre,
      tempproduct: newTempProduct,
      amount: 0,
      discount: 0,
      percentage: 0
    }))
    marginform.resetFields(['marginvalue'])
  }

  // margin data
  const marginOnchange = debounce((value) => {
    let marginamount = quotationft.totalamount * (value.marginvalue / 100)
    let finalamounts = customRound(quotationft.totalamount - marginamount)
    setQuotationFt((pre) => ({
      ...pre,
      amount: finalamounts,
      percentage: value.marginvalue,
      discount: marginamount
    }))
    let newData = quotationft.tempproduct.map((item) => {
      let marginamount = item.mrp * (value.marginvalue / 100)
      let finalamounts = customRound(item.mrp - marginamount)
      return {
        ...item,
        price: finalamounts,
        margin: value.marginvalue
      }
    })
    let totalprice = newData.map((data) => data.price).reduce((a, b) => a + b, 0)
    setQuotationFt((pre) => ({ ...pre, tempproduct: newData, totalamount: totalprice }))
  }, 300)

  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true)

      const initialData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted && data.date === today.format('DD/MM/YYYY'))
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            const mobileNumber =
              result.status === 200 ? result.customer.mobilenumber : item.mobilenumber
            const gstNumber = result.status === 200 ? result.customer.gstin : item.gstin
            const address = result.status === 200 ? result.customer.location : item.location

            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              customername: customerName,
              mobilenumber: mobileNumber,
              gstin: gstNumber,
              location: address
            }
          })
      )

      setSelectedTableData(initialData)
      setTableLoading(false)

      const initialDeliveryData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted)
          .map(async (item, index) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            const mobileNumber =
              result.status === 200 ? result.customer.mobilenumber : item.mobilenumber
            const gstNumber = result.status === 200 ? result.customer.gstin : item.gstin
            const address = result.status === 200 ? result.customer.location : item.location
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              customername: customerName,
              mobilenumber: mobileNumber,
              gstin: gstNumber,
              location: address
            }
          })
      )
      setDeliveryData(initialDeliveryData)
    }
    fetchData()
  }, [datas])

  useEffect(() => {
    const fetchFilteredData = async () => {
      const isWithinRange = (date) => {
        if (!dateRange[0] || !dateRange[1]) {
          return true
        }
        const dayjsDate = dayjs(date, 'DD/MM/YYYY')
        return (
          dayjsDate.isSame(dateRange[0], 'day') ||
          dayjsDate.isSame(dateRange[1], 'day') ||
          (dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1])))
        )
      }

      const newFilteredDelivery = await Promise.all(
        datas.delivery
          .filter((product) => !product.isdeleted && isWithinRange(product.date))
          .map(async (item) => {
            const result = await getCustomerById(item.customerid)
            const customerName =
              result.status === 200 ? result.customer.customername : item.customername
            const mobileNumber =
              result.status === 200 ? result.customer.mobilenumber : item.mobilenumber
            const gstNumber = result.status === 200 ? result.customer.gstin : item.gstin
            const address = result.status === 200 ? result.customer.location : item.location
            return {
              ...item,
              key: item.id,
              customername: customerName,
              mobilenumber: mobileNumber,
              gstin: gstNumber,
              location: address
            }
          })
      )

      setFilteredDelivery(newFilteredDelivery)
      let latestDataFilter = await latestFirstSort(newFilteredDelivery)
      setSelectedTableData(latestDataFilter)

      const newFilteredRawmaterials = await Promise.all(
        datas.rawmaterials
          .filter((rawmaterial) => !rawmaterial.isdeleted && isWithinRange(rawmaterial.date))
          .map(async (item) => {
            let supplierName
            if (item.type === 'Added') {
              const result = await getSupplierById(item.supplierid)
              supplierName = result.status === 200 ? result.supplier.suppliername : ''
            }
            return {
              ...item,
              key: item.id,
              customername: supplierName,
              total: item.billamount,
              billamount: item.billamount
            }
          })
      )
      setFilteredRawmaterials(newFilteredRawmaterials)

      let { deliverys, status } = await getAllPayDetailsFromAllDelivery()
      if (status) {
        let filterData = await Promise.all(
          deliverys
            .filter(
              (data) =>
                !data.isdeleted &&
                isWithinRange(data.date) &&
                (((data.collectiontype === 'delivery' ||
                  data.collectiontype === 'customer') && data.type === 'Payment') ||
                  (data.collectiontype === 'firstpartial' && data.type === 'firstpartial') ||
                  (data.collectiontype === 'employee' && data.type === 'Return'))
            )
            .map(async (data) => {
              let name = ''
              if (data.customerid) {
                const result = await getCustomerById(data.customerid)
                if (result.status) {
                  name = result.customer.customername
                }
              }
              if (data.deliveryid) {
                const result = await getDeliveryById(data.deliveryid)
                if (result.status) {
                  name = result.delivery.customername
                }
              }
              if (data.employeeid) {
                const result = await getEmployeeById(data.employeeid)
                if (result.status) {
                  name = result.employee.employeename
                }
              }
              return {
                ...data,
                name: name
              }
            })
        )

        // let calculateFilterData = await Promise.all(
        //   deliverys
        //     .filter(
        //       (data) =>
        //         isWithinRange(data.date) &&
        //         (data.collectiontype === 'delivery' || data.collectiontype === 'customer' || data.collectiontype === 'firstpartial')
        //     ))

        let totalAmount = filterData.reduce((total, data) => {
          const amount = Number(data.amount) || 0
            return total + amount
        }, 0)

        setTotalPayAmount(totalAmount)
        setFilteredPayments(filterData)

        let spendData = await Promise.all(
          deliverys
            .filter(
              (data) =>
                isWithinRange(data.date) &&
                (((data.collectiontype === 'supplier' || data.collectiontype === 'employee') && data.type === 'Payment') || (data.collectiontype === 'customer' && (data.type === 'Advance' || data.type === 'Spend')))
            )
            .map(async (data) => {
              let name = ''

              if (data.supplierid) {
                const result = await getSupplierById(data.supplierid)
                if (result.status) {
                  name = result.supplier.suppliername
                }
              }

              if (data.employeeid) {
                const result = await getEmployeeById(data.employeeid)
                if (result.status) {
                  name = result.employee.employeename
                }
              }

              if (data.customerid) {
                const result = await getCustomerById(data.customerid)
                if (result.status) {
                  name = result.customer.customername
                }
              }

              return {
                ...data,
                name: name
              }
            })
        )

        let spendAmount = spendData.reduce((total, data) => {
          const amount = Number(data.amount) || 0;
            return total + amount;
        }, 0)
        setTotalSpendAmount(spendAmount)

        setFilteredSpendingPayments(spendData)
      }

      const newFilteredSpending = await Promise.all(
        datas.spending
          .filter((spend) => !spend.isdeleted && isWithinRange(spend.date))
          .map(async (item) => ({
            ...item,
            key: item.id,
            customername: item.name,
            // total: item.amount,
            billamount: item.amount,
            type: item.description
          }))
      )
      setFilteredSpending(newFilteredSpending)
    }

    fetchFilteredData()
  }, [dateRange, datas.delivery, datas.rawmaterials, datas.spending])

  const handleDateChange = (dates) => {
    setDateRange(dates)
  }

  const showModal = async (record) => {
    
    setSelectedRecord(null);
    let itemsWithProductNames = []
    if (record.customerid) {
      const { items, status } = await fetchItemsForDelivery(record.id)
      if (status === 200) {
        itemsWithProductNames = items.map((item) => {
          const product = datas.product.find((product) => product.id === item.id && product.isdeleted === false);
          return {
            ...item,
            productname: product ? product.productname : ''
            // flavour: product ? product.flavour : '',
            // quantity: product ? product.quantity : ''
          }
        })};
    } else if (record.supplierid) {
      const { materialitem, status } = await fetchMaterials(record.id)
      if (status === 200) {
        itemsWithProductNames = await Promise.all(
          materialitem.map(async (item, i) => {
            let { material, status } = await getOneMaterialDetailsById(
              record.supplierid,
              item.materialid)
            return {
              sno: materialitem[i].sno, //add on sno(10/10/24, 5.52 pm)
              productname: material.materialname || '',
              // flavour: '',
              // quantity: material.unit || '',
              numberofpacks: item.quantity || 0
            }
          })
        )
      }
    } else {
      const { items, status } = await fetchItemsForDelivery(record.id)
      if (status === 200) {
        itemsWithProductNames = items.map((item) => {
          const product = datas.product.find((product) => product.id === item.id && product.isdeleted === false)
          return {
            ...item,
            productname: product ? product.productname : ''
            // flavour: product ? product.flavour : '',
            // quantity: product ? product.quantity : ''
          }
        })
      }
    }
    itemsWithProductNames.sort((a, b) => a.sno - b.sno)
    setSelectedRecord({ ...record, items: itemsWithProductNames })
    setIsModalVisible(true)
  }

  const totalSales = filteredDelivery
    .filter((product) => product.type !== 'return')
    .reduce((total, product) => total + product.billamount, 0)

  const totalRawSpend = filteredRawmaterials
    .filter((material) => material.type === 'Added')
    .reduce((total, material) => {
      if (material.paymentstatus === 'Paid') {
        return total + material.billamount
      } else if (material.paymentstatus === 'Partial') {
        return total + material.partialamount
      }
      return total
    }, 0)

  const totalSpend = totalRawSpend + Number(totalSpendAmount)

  // const totalRawPurchase = filteredRawmaterials
  //   .filter((material) => material.type === 'Added')
  //   .reduce((total, material) => total + material.price, 0)

  const totalReturn = filteredDelivery
    .filter((product) => product.type === 'return')
    .reduce((total, product) => total + product.billamount, 0)

  const totalGeneralSpending = filteredSpending.reduce(
      (total, product) => total + product.amount,
      0
  )

  const totalProfit = totalSales - totalSpend - totalReturn - totalGeneralSpending

  const totalBooking = deliveryData.filter((product) => {
    return (
      product.type === 'booking' &&
      dayjs(product.deliverydate, 'DD/MM/YYYY').isSameOrAfter(dayjs(), 'day')
    )
  }).length

  const totalPaid = filteredDelivery.reduce((total, product) => {
    if (product.paymentstatus === 'Paid' && product.type !== 'return') {
      return total + (Number(product.billamount) || 0)
    }
    // else if (product.paymentstatus === 'Partial' && product.type === 'order') {
    //   return total + (Number(product.partialamount) || 0)
    // }
    return total
  }, 0)

  const totalUnpaid = filteredDelivery.reduce((total, product) => {
    if (product.paymentstatus === 'Unpaid') {
      return total + (Number(product.billamount) || 0)
    } else if (product.paymentstatus === 'Partial') {
      return total + ((Number(product.billamount) || 0) - (Number(product.partialamount) || 0))
    }
    return total
  }, 0)

  const [activeCard, setActiveCard] = useState('')
  const cardsData = [
    { key: 'totalSales', title: 'Total Sales', value: totalSales, prefix: <FaRupeeSign /> },
    { key: 'totalSpend', title: 'Total Expenses', value: totalSpend, prefix: <FaRupeeSign /> },
    { key: 'totalReturn', title: 'Total Return', value: totalReturn, prefix: <FaRupeeSign /> },
    { key: 'totalGeneralSpending', title: 'General Spending', value: totalGeneralSpending, prefix: <FaRupeeSign /> },
    { key: 'totalPaid', title: 'Total Paid', value: totalPaid, prefix: <FaRupeeSign /> },
    { key: 'totalUnpaid', title: 'Total Unpaid', value: totalUnpaid, prefix: <FaRupeeSign /> },
    { key: 'totalProfit', title: 'Total Profit/Loss', value: totalProfit, prefix: <FaRupeeSign /> },
    { key: 'totalBooking', title: 'Total Booking', value: totalBooking, prefix: <IoPerson /> }
  ]

  const handleCardClick = async (type) => {
    setActiveCard(type)
    let newSelectedTableData = []
    switch (type) {
      case 'totalSales':
        newSelectedTableData = filteredDelivery.filter((product) => product.type !== 'return')
        break
      case 'totalSpend': {
        const rawMaterialsData = filteredRawmaterials.filter(
          (material) =>
            material.type === 'Added' &&
            (material.paymentstatus === 'Paid' || material.paymentstatus === 'Partial')
        )
        const otherSpend = filteredSpendingPayments.map((pay) => ({
          ...pay,
          customername: pay.name,
          billamount: pay.amount
        }))
        newSelectedTableData = [...rawMaterialsData, ...otherSpend]
        break
      }
      case 'totalGeneralSpending':
        newSelectedTableData = filteredSpending
        break
      case 'totalReturn':
        newSelectedTableData = filteredDelivery.filter((product) => product.type === 'return')
        break
      case 'totalBooking':
        newSelectedTableData = deliveryData
          .filter((product) => {
            return (
              product.type === 'booking' &&
              dayjs(product.deliverydate, 'DD/MM/YYYY').isSameOrAfter(dayjs(), 'day')
            )
          })
          .map((product) => {
            const dateTimeString = `${product.deliverydate} ${product.time}`
            //const productDateTime = dayjs(dateTimeString, 'DD/MM/YYYY HH:mm')
            return {
              ...product,
              date: dateTimeString
            }
          })
        break
      case 'totalPaid': {
        const deliveryData = filteredDelivery.filter(
          (product) =>
            product.type !== 'return' &&
            (product.paymentstatus === 'Paid' || product.paymentstatus === 'Partial')
        )
        const filterPayment = filteredPayments
          .map((pay) => ({
            ...pay,
            customername: pay.name,
            billamount: pay.amount
          }))
        newSelectedTableData = [...deliveryData, ...filterPayment]
        break
      }
      case 'totalUnpaid':
        newSelectedTableData = filteredDelivery.filter(
          (product) => product.paymentstatus === 'Unpaid' || product.paymentstatus === 'Partial'
        )
        break
      default:
        newSelectedTableData = filteredDelivery
    }
    let filterLatestData = await latestFirstSort(newSelectedTableData)
    setSelectedTableData(filterLatestData)
  }

  const handlePaymentTypeClick = async (paymentMode) => {
    const filtered = filteredDelivery.filter(
      (product) =>
        product.type !== 'return' &&
        (product.paymentstatus === 'Paid' || product.paymentstatus === 'Partial') &&
        product.paymentmode === paymentMode
    )
    const filterPayment = filteredPayments
      .filter(
        (pay) =>
          pay.paymentmode === paymentMode &&
          pay.collectiontype !== 'firstpartial'
      )
      .map((pay) => ({
        ...pay,
        customername: pay.name,
        billamount: pay.amount
      }))
    let combinedData = [...filtered, ...filterPayment]
    let filterLatestData = await latestFirstSort(combinedData)
    setSelectedTableData(filterLatestData)
  }

  const componentRef = useRef()
  const printRef = useRef()
  const [isPrinting, setIsPrinting] = useState(false)
  const promiseResolveRef = useRef(null)

  const [invoiceDatas, setInvoiceDatas] = useState({
    data: [],
    isGenerate: false,
    customerdetails: {}
  })

  const [gstin, setGstin] = useState(false)
  const [loadingGstin, setLoadingGstin] = useState(false)
  const [loadingWithoutGstin, setLoadingWithoutGstin] = useState(false)
  const [hasPdf, setHasPdf] = useState(false)

  const handleDownloadPdf = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
    const result = await getCustomerById(record.customerid)
    const { freezerbox } = await getFreezerboxById(record.boxid);
    let boxnumber = freezerbox === undefined ? '' : freezerbox.boxnumber;
    const gstin = result.customer?.gstin || ''
    const location = result.customer?.location || ''
    if (status === 200) {
      let prData = datas.product.filter((item, i) => items.find((item2) => item.id === item2.id))
      // let prItems = await prData.map((pr, i) => {
      //   let matchingData = items.find((item, i) => item.id === pr.id)
      //   return {
      //     sno: matchingData.sno,
      //     ...pr,
      //     pieceamount: pr.price,
      //     quantity: pr.quantity + ' ' + pr.unit,
      //     margin: matchingData.margin,
      //     price:
      //       matchingData.numberofpacks * pr.price -
      //       matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
      //     numberofpacks: matchingData.numberofpacks,
      //     producttotalamount: matchingData.numberofpacks * pr.price,
      //     returntype: matchingData.returntype
      //   }
      // })
      let prItems = prData.flatMap((pr, i) => {
        // Get all matching items with the same id
        let matchingItems = items.filter((item) => item.id === pr.id)

        // If there are matching items, map over them to return multiple results
        return matchingItems.map((matchingData) => ({
          sno: matchingData.sno,
          ...pr,
          pieceamount: pr.price,
          quantity: `${pr.quantity} ${pr.unit}`,
          margin: matchingData.margin,
          price:
            matchingData.numberofpacks * pr.price -
            matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
          numberofpacks: matchingData.numberofpacks,
          producttotalamount: matchingData.numberofpacks * pr.price,
          returntype: matchingData.returntype
        }))
      })
      prItems.sort((a, b) => a.sno - b.sno)
      setInvoiceDatas((pre) => ({
        ...pre,
        data: prItems,
        isGenerate: true,
        customerdetails: {
          ...record,
          gstin: gstin,
          location: location,
          boxnumber: boxnumber
        }
      }))
      setLoadingGstin(false)
      setLoadingWithoutGstin(false)
    }
  }

  // const handlePrint = async (record) => {
  //   const { items, status } = await fetchItemsForDelivery(record.id)
  //   const result = await getCustomerById(record.customerid)
  //   const gstin = result.customer?.gstin || ''
  //   const location = result.customer?.location || ''
  //   if (status === 200) {
  //     let prData = datas.product.filter((item, i) => items.find((item2) => item.id === item2.id))
  //     let prItems = await prData.map((pr, i) => {
  //       let matchingData = items.find((item, i) => item.id === pr.id)
  //       return {
  //         sno: i + 1,
  //         ...pr,
  //         pieceamount: pr.price,
  //         quantity: pr.quantity + ' ' + pr.unit,
  //         margin: matchingData.margin,
  //         price:
  //         matchingData.numberofpacks * pr.price -
  //         matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
  //         numberofpacks: matchingData.numberofpacks,
  //         producttotalamount: matchingData.numberofpacks * pr.price,
  //         returntype: matchingData.returntype
  //       }
  //     });
  //     console.log(record);
  //     await setInvoiceDatas((pre) => ({
  //       ...pre,
  //       data: prItems,
  //       isGenerate: false,
  //       customerdetails: {
  //         ...record,
  //         gstin: gstin,
  //         location: location
  //       }
  //     }))
  //   }
  // }

  const handlePrint = async (record) => {
    try {
      const { items, status } = await fetchItemsForDelivery(record.id)
      if (status !== 200) {
        throw new Error(`Failed to fetch items: ${status}`)
      }
      const { freezerbox } = await getFreezerboxById(record.boxid);
      let boxnumber = freezerbox === undefined ? '' : freezerbox.boxnumber;
      const result = await getCustomerById(record.customerid)
      const gstin = result.customer?.gstin || ''
      const location = result.customer?.location || ''

      let prData = datas.product.filter((item) => items.find((item2) => item.id === item2.id))
      // let prData = datas.product.filter((item) => item.isdeleted === false)

      let prItems = prData.flatMap((pr, i) => {
        // Get all matching items with the same id
        let matchingItems = items.filter((item) => item.id === pr.id)

        // If there are matching items, map over them to return multiple results
        return matchingItems.map((matchingData) => ({
          sno: matchingData.sno,
          ...pr,
          pieceamount: pr.price,
          quantity: `${pr.quantity} ${pr.unit}`,
          margin: matchingData.margin,
          price:
            matchingData.numberofpacks * pr.price -
            matchingData.numberofpacks * pr.price * (matchingData.margin / 100),
          numberofpacks: matchingData.numberofpacks,
          producttotalamount: matchingData.numberofpacks * pr.price,
          returntype: matchingData.returntype
        }))
      })

      prItems.sort((a, b) => a.sno - b.sno)
      setInvoiceDatas((pre) => ({
        ...pre,
        data: prItems,
        isGenerate: false,
        customerdetails: {
          ...record,
          gstin,
          location,
          boxnumber
        }
      }))
    } catch (error) {
      console.error('Error in handlePrint:', error)
      throw error // Ensure to propagate the error
    }
  }

  const handleQuotationPrint = async () => {
    // data
    let { date } = quotationft.tempproduct[0]
    // customer details
    let cusotmerData = {
      customername:
        quotationft.customername === null || quotationft.customername === ''
          ? undefined
          : quotationft.customername,
      mobilenumber:
        quotationft.mobilenumber === null || quotationft.mobilenumber === ''
          ? undefined
          : quotationft.mobilenumber,
      date,
      gstin: '',
      total: quotationft.mrpamount,
      billamount: quotationft.totalamount,
      location: '',
      partialamount: 0
    }
    // product items
    let items = quotationft.tempproduct.map((data, i) => ({
      sno: i + 1,
      productname: data.productname,
      // flavour: data.flavour,
      // quantity: data.quantity,
      pieceamount: data.productprice,
      numberofpacks: data.numberofpacks,
      producttotalamount: data.mrp,
      margin: data.margin,
      price: data.price
    }))

    // console.log(items);
    setInvoiceDatas((pre) => ({
      ...pre,
      data: items,
      isGenerate: false,
      customerdetails: cusotmerData
    }))

    // console.log(cusotmerData,items);

    // setIsPrinting(true);

    // await setInvoiceDatas((pre) => ({
    //   ...pre,
    //   data: prItems,
    // }))
    // message.open({ type: 'success', content: 'Quotation Created' })
  }

  const handleQuotationDownload = async () => {
    try{
      setGstBillPdf(true)

      setHasPdf(true)

    // data
    let { date } = quotationft.tempproduct[0];
    // customer details
    let cusotmerData = {
      customername:
        quotationft.customername === null || quotationft.customername === ''
          ? undefined
          : quotationft.customername,
      mobilenumber:
        quotationft.mobilenumber === null || quotationft.mobilenumber === ''
          ? undefined
          : quotationft.mobilenumber,
      date,
      gstin: '',
      total: quotationft.mrpamount,
      billamount: quotationft.totalamount,
      location: '',
      partialamount: 0
    };
    // product items
    let items = quotationft.tempproduct.map((data, i) => ({
      sno: i + 1,
      productname: data.productname,
      // flavour: data.flavour,
      // quantity: data.quantity,
      pieceamount: data.productprice,
      numberofpacks: data.numberofpacks,
      producttotalamount: data.mrp,
      margin: data.margin,
      price: data.price
    }));

    setInvoiceDatas((pre) => ({
      ...pre,
      data: items,
      isGenerate: true,
      customerdetails: cusotmerData
    }));
    // console.log(items);
    // await setInvoiceDatas({
    //   data: items,
    //   isGenerate: false,
    //   customerdetails: cusotmerData,
    //   location: ''
    // });
    // await setInvoiceDatas((pre) => ({
    //   ...pre,
    //   data: prItems,
    // }))
    message.open({ type: 'success', content: 'Quotation PDF Download Successfully' })
    }
    catch(e){
      console.log(e);
      message.open({ type: 'error', content: `${e} Quotation PDF Download Unsuccessfully` });
    }
  };

  useEffect(() => {
    if (isPrinting && promiseResolveRef.current) {
      promiseResolveRef.current()
    }
  }, [isPrinting])

  const [gstBill, setGstBill] = useState(false)
  const [gstBillPdf, setGstBillPdf] = useState(false)
  const GstBillRef = useRef()
  const GstComponentRef = useRef()

  // useEffect(() => {
  //   const generatePDF = async () => {
  //     if (invoiceDatas.isGenerate) {
  //       const element = gstBill === true ? GstBillRef.current : printRef.current // The element to print

  //       // Set the scale for html2canvas (this helps with controlling size)
  //       const canvas = await html2canvas(element, {
  //         scale: 2, // You can adjust the scale to improve resolution
  //         useCORS: true // This is useful for handling cross-origin content
  //       })

  //       // Get the canvas as a data URL
  //       const data = canvas.toDataURL('image/png')

  //       // Initialize jsPDF
  //       const pdf = new jsPDF('p', 'mm', 'a4') // 'p' for portrait, 'mm' for millimeters, and 'a4' size

  //       // Calculate the dimensions of the image
  //       const imgWidth = 210 // A4 width in mm
  //       const pageHeight = 297 // A4 height in mm
  //       const imgHeight = (canvas.height * imgWidth) / canvas.width // Keep aspect ratio

  //       let heightLeft = imgHeight
  //       let position = 0

  //       // Add the image to the PDF
  //       pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
  //       heightLeft -= pageHeight

  //       // Handle multi-page PDFs
  //       while (heightLeft > 0) {
  //         position = heightLeft - imgHeight
  //         pdf.addPage()
  //         pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
  //         heightLeft -= pageHeight
  //       }

  //       // Save the generated PDF
  //       pdf.save(
  //         `${invoiceDatas.customerdetails.customername}-${invoiceDatas.customerdetails.date}.pdf`
  //       )

  //       // Reset the state after generating the PDF
  //       await setInvoiceDatas((pre) => ({ ...pre, isGenerate: false }))
  //     }
  //   }

  //   generatePDF()
  // }, [invoiceDatas.isGenerate, printRef])

  useEffect(() => {
    const generatePDF = async () => {
      if (invoiceDatas.isGenerate) {
        const element = gstBill === true ? GstBillRef.current : printRef.current // The element to print

        // Set the scale for html2canvas
        const canvas = await html2canvas(element, {
          scale: 2, // Adjust scale for better resolution
          useCORS: true, // Handle cross-origin content
          logging: true, // Optional: Log messages to the console for debugging
          width: element.scrollWidth, // Set width to capture all content
          height: element.scrollHeight // Set height to capture all content
        })

        // Get the canvas as a data URL
        const data = canvas.toDataURL('image/png')

        // Initialize jsPDF
        const pdf = new jsPDF('p', 'mm', 'a4') // 'p' for portrait, 'mm' for millimeters, and 'a4' size

        const imgWidth = 210 // A4 width in mm
        const pageHeight = 297 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width // Maintain aspect ratio

        let heightLeft = imgHeight
        let position = 0

        // Add the image to the PDF
        pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Handle multi-page PDFs
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        // Save the generated PDF
        pdf.save(
          `${invoiceDatas.customerdetails.customername === undefined ? 'Quotation' : invoiceDatas.customerdetails.customername}-${invoiceDatas.customerdetails.date}-Time-${TimestampJs().split(' ')[1]}.pdf`
        )

        // Reset the state after generating the PDF
        setInvoiceDatas((prev) => ({ ...prev, isGenerate: false }))
      }
    }

    generatePDF()
  }, [invoiceDatas.isGenerate, printRef])


  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      sorter: (a, b) => {
        const format = 'DD/MM/YYYY'
        const dateA = dayjs(a.date, format)
        const dateB = dayjs(b.date, format)
        return dateB.isAfter(dateA) ? -1 : 1
      }
      // defaultSortOrder: 'descend'
    },
    {
      title: 'Name',
      dataIndex: 'customername',
      key: 'customername',
      render: (text, record) => {
        if (activeCard === 'totalSpend') {
          return record.collectiontype === 'supplier' ? (
            <>
              {text} <Tag color="gold">Supplier</Tag>
            </>
          ) : record.collectiontype === 'employee' ? (
            <>
              {' '}
              {text} <Tag color="purple">Employee</Tag>
            </>
          ) : record.collectiontype === 'customer' ? (
            <>
              {' '}
              {text} <Tag color="volcano">Customer</Tag>
            </>
          ): (
            text
          )
        } else if (activeCard === 'totalPaid' || activeTabKey2 === 'total') {
          return record.collectiontype === 'customer' ? (
            <>
              {text} <Tag color="gold">Customer</Tag>
            </>
          ) : record.collectiontype === 'delivery' ? (
            <>
              {' '}
              {text} <Tag color="purple">Delivery</Tag>
            </>
          ) : record.collectiontype === 'employee' ? (
            <>
              {' '}
              {text} <Tag color="volcano">Employee</Tag>
            </>
          ) : (
            text
          )
        } else {
          return text
        }
      }
    },
    {
      title: 'Gross Amount',
      dataIndex: 'total',
      key: 'total',
      width: 140
    },
    {
      title: 'Amount',
      dataIndex: 'billamount',
      key: 'billamount',
      render: (text) => <span>{formatToRupee(text, true)}</span>,
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render: (text, record) => {
        
        const { partialamount, bookingstatus } = record
        if (text === 'Paid') {
          return (
            <>
              <Tag className={`${record.type === undefined || record.type === '' || record.type ===null ? 'hidden': 'inline-block'}`} color="blue">{record.type}</Tag>
              {bookingstatus && <Tag className={`${record.bookingstatus === undefined || record.bookingstatus === '' ? 'hidden':'inline-block'}`} color="geekblue">{bookingstatus}</Tag>}
              <Tag className={`${text === undefined || text === '' || text ===null ? 'hidden': 'inline-block'}`} color="green">{text}</Tag>
              <Tag className={`${record.paymentmode === undefined || record.paymentmode === '' || record.paymentmode ===null ? 'hidden': 'inline-block'}`} color="cyan">{record.paymentmode}</Tag>
            </>
          )
        } else if (text === 'Partial') {
          return (
            <>
              <Tag className={`${record.type === undefined || record.type === '' || record.type ===null ? 'hidden': 'inline-block'}`} color="blue">{record.type}</Tag>
              {bookingstatus && <Tag className={`${record.bookingstatus === undefined || record.bookingstatus === '' ? 'hidden':'inline-block'}`} color="geekblue">{bookingstatus}</Tag>}
              <Tag color="yellow">
                {text} - {partialamount}
              </Tag>
              <Tag color="cyan">{record.paymentmode}</Tag>
            </>
          )
        } else if (text === 'Return') {
          return (
            <>
              <Tag className={`${record.type === undefined || record.type === '' || record.type ===null ? 'hidden': 'inline-block'}`} color="red">{record.type === 'return' ? 'Returned' : record.type}</Tag>
              <Tag color="red">{text}</Tag>
            </>
          )
        } else {
          return (
            <>
              <Tag className={`${record.type === undefined || record.type === '' || record.type ===null ? 'hidden': 'inline-block'}`} color="blue">{record.type}</Tag>
              {bookingstatus && <Tag className={`${record.bookingstatus === undefined || record.bookingstatus === '' ? 'hidden':'inline-block'}`} color="geekblue">{bookingstatus}</Tag>}
              <Tag className={`${text === undefined || text === '' ? 'hidden' : ''}`} color="red">
                {text}
              </Tag>
              <Tag className={record.paymentmode ? '' : 'hidden'} color="cyan">
                {record.paymentmode}
              </Tag>
            </>
          )
        }
      }
    },
    {
      title: 'Action',
      dataIndex: 'action',
      width: 150,
      render: (_, record) => {
        return (
          <span>
            <Button
              disabled={Object.keys(record).includes('collectiontype') || record.spendingtype === 'General' ? true : false}
              className="py-0 text-[0.7rem] h-[1.7rem]"
              icon={<UnorderedListOutlined />}
              style={{ marginRight: 8 }}
              onClick={() => showModal(record)}
            />

            <Popconfirm
              placement="leftTop"
              className="py-0 text-[0.7rem] h-[1.7rem]"
              // className={`py-0 text-[0.7rem] h-[1.7rem] ${Object.keys(record).includes('collectiontype') ? 'hidden':'inline-block'}`}
              title={
                <div>
                  <span>Sure to download pdf?</span>
                  <section className="flex gap-x-2 mt-2">
                    <Button
                      loading={loadingGstin}
                      disabled={
                        record.gstin === undefined || record.gstin === '' || record.gstin === null
                          ? true
                          : false
                      }
                      size="small"
                      className="text-[0.7rem]"
                      type="primary"
                      onClick={async () => {
                        setGstBillPdf(true)
                        setGstBill(true)
                        setHasPdf(true)
                        setLoadingGstin(true)
                        setGstin(true)
                        await handleDownloadPdf(record)
                      }}
                    >
                      GST
                    </Button>
                    <Button
                      loading={loadingWithoutGstin}
                      size="small"
                      className="text-[0.7rem]"
                      type="dashed"
                      onClick={async () => {
                        setGstBillPdf(true)
                        setGstBill(false)
                        setHasPdf(true)
                        setLoadingWithoutGstin(true)
                        setGstin(false)
                        await handleDownloadPdf(record)
                      }}
                    >
                      Without GST
                    </Button>
                    {/* <Button size='small' className='text-[0.7rem]' >Cancel</Button> */}
                  </section>
                </div>
              }
              // onConfirm={() => handleDownloadPdf(record)}
              onConfirm={null} // Set onConfirm to null
              showCancel={false} // Hides the cancel button
              okButtonProps={{ style: { display: 'none' } }} // Hides the ok button
            >
              <Button
                disabled={
                  Object.keys(record).includes('collectiontype') || record.type === 'Added' || record.spendingtype === 'General'
                    ? true
                    : false
                }
                className="py-0 text-[0.7rem] h-[1.7rem]"
                icon={<DownloadOutlined />}
                style={{ marginRight: 8 }}
              />
            </Popconfirm>

            {/* <ReactToPrint
          trigger={() => (
            <Button disabled={Object.keys(record).includes('collectiontype') || record.type === "Added" ? true:false} className="py-0 text-[0.7rem] h-[1.7rem]" icon={<PrinterOutlined />} />
          )}
          onBeforeGetContent={async () => {
            return new Promise((resolve) => {
              promiseResolveRef.current = resolve
              handlePrint(record).then(() => {
                setIsPrinting(true)
              })
            })
          }}
          content={() => componentRef.current}
          onAfterPrint={() => {
            promiseResolveRef.current = null
            setIsPrinting(false)
          }}
        /> */}

            <Popconfirm
              // title="Are you sure you want to print this?"
              title={
                <div>
                  <span>Are you sure you want to print this?</span>
                  <section className="flex gap-x-2 mt-2">
                    {/* gst */}
                    <Button
                      loading={loadingGstin}
                      disabled={
                        record.gstin === undefined || record.gstin === '' || record.gstin === null
                          ? true
                          : false
                      }
                      size="small"
                      className="text-[0.7rem]"
                      type="primary"
                      onClick={async () => {
                        setGstBillPdf(false)
                        setGstBill(true)
                        setHasPdf(false)
                        setIsPrinting(true)
                        setLoadingGstin(true)
                        setGstin(true)
                        await handlePrint(record).then(() => {
                          promiseResolveRef.current && promiseResolveRef.current()
                          document.getElementById(`print-trigger-${record.id}`).click()
                          setLoadingGstin(false)
                        })
                      }}
                    >
                      GST
                    </Button>

                    {/* without gst */}
                    <Button
                      loading={loadingWithoutGstin}
                      size="small"
                      className="text-[0.7rem]"
                      type="dashed"
                      onClick={async () => {
                        setGstBillPdf(false)
                        setGstBill(false)
                        setHasPdf(false)
                        setIsPrinting(true)
                        setLoadingWithoutGstin(true)
                        setGstin(false)
                        await handlePrint(record).then(() => {
                          promiseResolveRef.current && promiseResolveRef.current()
                          document.getElementById(`print-trigger-${record.id}`).click()
                          setLoadingWithoutGstin(false)
                        })
                      }}
                    >
                      Without GST
                    </Button>
                  </section>
                </div>
              }
              onConfirm={null}
              showCancel={false}
              okButtonProps={{ style: { display: 'none' } }}
              okText="Without GST"
              cancelText="GST"
              onCancel={() => {
                setGstin(true)
                setIsPrinting(true)
                promiseResolveRef.current && promiseResolveRef.current()
                document.getElementById(`print-trigger-${record.id}`).click()
                console.log(record)
              }}
            >
              <Button
                disabled={
                  Object.keys(record).includes('collectiontype') || record.type === 'Added' || record.spendingtype === 'General'
                    ? true
                    : false
                }
                className="py-0 text-[0.7rem] h-[1.7rem]"
                icon={<PrinterOutlined />}
              />
            </Popconfirm>

            <ReactToPrint
              trigger={() => (
                <button style={{ display: 'none' }} id={`print-trigger-${record.id}`}></button>
              )}
              onBeforeGetContent={async () => {
                return new Promise((resolve) => {
                  promiseResolveRef.current = resolve
                  handlePrint(record)
                    .then(() => {
                      setIsPrinting(true)
                      resolve() // Resolve once handlePrint completes successfully
                    })
                    .catch((error) => {
                      console.error('Print preparation error:', error)
                      resolve() // Ensure to resolve even on error
                    })
                })
              }}
              content={() => (gstBill === true ? GstComponentRef.current : componentRef.current)}
              onAfterPrint={() => {
                promiseResolveRef.current = null
                setIsPrinting(false)
              }}
            />
            {/* <ReactToPrint
  trigger={() => (
    <button id={`print-trigger-${record.id}`} style={{ display: 'none' }}></button>
  )}
  onBeforeGetContent={async () => {
    return new Promise((resolve) => {
      promiseResolveRef.current = resolve;
      handlePrint(record).then(() => {
        setIsPrinting(true);
      });
    });
  }}
  content={() => componentRef.current}
  onAfterPrint={() => {
    promiseResolveRef.current = null;
    setIsPrinting(false);
  }}
/> */}
          </span>
        )
      }
    }
  ]

  const quotationColumns = [
    {
      title: 'Product',
      key: 'productname',
      dataIndex: 'productname'
    },
    {
      title: 'Flavour',
      key: 'flavour',
      dataIndex: 'flavour'
    },
    {
      title: 'Size',
      key: 'quantity',
      dataIndex: 'quantity'
    },
    {
      title: 'Rate',
      key: 'pieceamount',
      dataIndex: 'pieceamount'
    },
    {
      title: 'Qty',
      key: 'numberofpacks',
      dataIndex: 'numberofpacks'
    },
    {
      title: 'MRP',
      key: 'producttotalamount',
      dataIndex: 'producttotalamount'
    },
    {
      title: 'Amount',
      key: 'price',
      dataIndex: 'price'
    }
  ]

  const [option, setOption] = useState({
    flavour: [],
    flavourstatus: true,
    product: [],
    productvalue: '',
    quantity: [],
    quantitystatus: true,
    tempproduct: []
  })

  //product initial value
  useEffect(() => {
    const productOp = datas.product
      .filter(
        (item, i, s) =>
          item.isdeleted === false &&
          s.findIndex((item2) => item2.productname === item.productname) === i
      )
      .map((data) => ({ label: data.productname, value: data.productname }))
    setOption((pre) => ({ ...pre, product: productOp }))
  }, [datas])

  const productOnchange = async (value, i) => {
    form.resetFields(['flavour'])
    form.resetFields(['quantity'])
    // form.resetFields(['numberofpacks'])
    const flavourOp = Array.from(
      new Set(
        datas.product
          .filter((item) => item.isdeleted === false && item.productname === value)
          .map((data) => data.flavour)
      )
    ).map((flavour) => ({ label: flavour, value: flavour }))
    setOption((pre) => ({
      ...pre,
      flavourstatus: false,
      flavour: flavourOp,
      productvalue: value,
      quantitystatus: true
    }))
  }

  //flavour onchange value
  const flavourOnchange = async (value, i) => {
    form.resetFields(['quantity'])
    form.resetFields(['numberofpacks'])
    const quantityOp = Array.from(
      new Set(
        datas.product.filter(
          (item) =>
            item.isdeleted === false &&
            item.flavour === value &&
            item.productname === option.productvalue
        )
      )
    ).map((q) => ({ label: q.quantity + ' ' + q.unit, value: q.quantity + ' ' + q.unit }))
    setOption((pre) => ({ ...pre, quantitystatus: false, quantity: quantityOp }))
  }

  // (Add to List) btn
  const addTempProduct = async (values) => {
    setQuotationFt((pre) => ({ ...pre, count: pre.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''

    // let [quantityvalue, units] = values.quantity.split(' ')
    const findPrice = await datas.product.find(
      (item) => item.isdeleted === false && item.productname === values.productname
      // && item.flavour === values.flavour &&
      // item.quantity === Number(quantityvalue) &&
      // item.unit === units
    ).price

    const newProduct = {
      ...values,
      key: quotationft.count,
      date: formattedDate,
      createddate: TimestampJs(),
      mrp: findPrice * values.numberofpacks,
      productprice: findPrice,
      margin: 0,
      price: findPrice * values.numberofpacks
    }

    const checkExsit = quotationft.tempproduct.some(
      (item) =>
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.date === newProduct.date
    )

    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
    } else {
      // mrp and total price
      let totalprice = [...quotationft.tempproduct, newProduct]
        .map((data) => data.price)
        .reduce((a, b) => a + b, 0)
      let mrpprice = [...quotationft.tempproduct, newProduct]
        .map((data) => data.mrp)
        .reduce((a, b) => a + b, 0)

      setQuotationFt((pre) => ({
        ...pre,
        totalamount: totalprice,
        tempproduct: [...pre.tempproduct, newProduct],
        amount: 0,
        discount: 0,
        percentage: 0,
        mrpamount: mrpprice
      }))

      marginform.resetFields(['marginvalue'])
    }
  }

  const itemColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50
      // render:(text,record,i)=>{
      //     console.log(record);
      //   return record.sno
      // }
    },
    {
      title: 'Item Name',
      dataIndex: 'productname',
      key: 'productname',
      // render:(text)=>{
      //   console.log(text);
      // }
      // render: (text, record) => `${record.productname} - ${record.unit}`
    },
    {
      title: 'Number of pieces',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks'
    }
  ]

  // Table Hight Auto Adjustment (***Do not tounch this code*** ) //
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 280 // Adjust this value based on your layout needs
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

  // warning modal
  const [warningModal, setWarningModal] = useState(false)
  // cancel btn
  const warningModalCancel = () => {
    setWarningModal(false)
  }
  // ok btn
  const warningModalok = () => {
    setWarningModal(false)
    setQuotationFt({
      date: null,
      type: 'With GST',
      tempproduct: [],
      margin: 0,
      discount: 0,
      percentage: 0,
      amount: 0,
      count: 0,
      totalamount: 0,
      editingkey: '',
      mrpamount: 0,
      onfocus: false,
      edmargin: true,
      edprice: true,
      edpacks: true,
      customername: '',
      mobilenumber: ''
    })
    setQuotationModalOpen(false)
    marginform.resetFields(['marginvalue'])
  }

  // card
  const tabListNoTitle = [
    {
      key: 'total',
      label: 'Total Paid'
    },
    {
      key: 'cash',
      label: 'Cash'
    },
    {
      key: 'card',
      label: 'Card'
    },
    {
      key: 'upi',
      label: 'UPI'
    }
  ]

  const calculateCombinedAmount = (paymentMode) => {
    const paymentAmount = filteredPayments
      .filter((payment) => payment.paymentmode === paymentMode)
      .reduce((total, payment) => total + (Number(payment.amount) || 0), 0)
    const deliveryAmount = filteredDelivery.reduce((total, product) => {
      if (
        product.paymentstatus === 'Paid' &&
        product.type !== 'return' &&
        product.paymentmode === paymentMode
      ) {
        return total + (Number(product.billamount) || 0)
      }
      // else if (
      //   product.paymentstatus === 'Partial' &&
      //   product.type === 'order' &&
      //   product.paymentmode === paymentMode
      // ) {
      //   return total + (Number(product.partialamount) || 0)
      // }
      return total
    }, 0)
    return paymentAmount + deliveryAmount
  }

  const combinedCashAmount = calculateCombinedAmount('Cash')
  const combinedCardAmount = calculateCombinedAmount('Card')
  const combinedUpiAmount = calculateCombinedAmount('UPI')

  const contentListNoTitle = {
    cash: <p className="pl-4">{formatToRupee(combinedCashAmount)}</p>,
    card: <p className="pl-4">{formatToRupee(combinedCardAmount)}</p>,
    upi: <p className="pl-4">{formatToRupee(combinedUpiAmount)}</p>,
    total: <p className="pl-4">{formatToRupee(totalPaid + Number(totalPayAmount))}</p>
  }

  const [activeTabKey2, setActiveTabKey2] = useState('total')

  const onTab2Change = (key) => {
    setActiveTabKey2(key)
    if (key === 'cash') {
      handlePaymentTypeClick('Cash')
    } else if (key === 'card') {
      handlePaymentTypeClick('Card')
    } else if (key === 'upi') {
      handlePaymentTypeClick('UPI')
    } else {
      handleCardClick('totalPaid')
    }
  }

  // Without GST
  const pdfBillStyle = { heading: '26px', subheading: '24px', para: '20px',logo:'94px' }
  const printBillStyle = { heading: '18px', subheading: '14px', para: '11px', logo:'64px' }

  // GST
  const GstBillStylePdf = { heading: '24px', subheading: '20px', para: '16px' }
  const GstBillStylePrint = { heading: '20px', subheading: '16px', para: '11px' }


  const quotationTableHeight = TableHeight(200,460)

  
  return (
    <div>
      {/* old pdf and print start */}
      <div
        ref={printRef}
        className="absolute top-[-200rem] w-full"
        // className='w-full h-screen'
        style={{ padding: '20px', backgroundColor: '#ffff' }}
      >
        <div ref={componentRef}>
          <section className="w-[90%] mx-auto mt-4">
            <ul className="flex justify-center items-center gap-x-2">
              <li>
                <img
                  // className="w-[3rem]"
                  width={hasPdf === true ? pdfBillStyle.logo : printBillStyle.logo}
                  src={companyLogo}
                  alt="comapanylogo"
                />
              </li>
              <li className="text-center">
                <h1
                  style={{
                    fontWeight: 'bold',
                    fontSize: `${hasPdf === true ? pdfBillStyle.heading : printBillStyle.heading}`
                  }}
                  // className={`${hasPdf === true ? 'text-[1.5rem]' : 'text-[0.7rem]'} font-bold`}
                >
                  NEW SARANYA ICE COMPANY
                </h1>
                <p
                  style={{
                    fontSize: `${hasPdf === true ? pdfBillStyle.subheading : printBillStyle.subheading}`
                  }}
                  // className={`${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'}`}
                >
                  PILAVILAI, AZHAGANPARAI P.O.
                </p>
                <p
                  style={{
                    fontSize: `${hasPdf === true ? pdfBillStyle.subheading : printBillStyle.subheading}`
                  }}
                  // className={`${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'}`}
                >
                  K.K.DIST
                </p>
              </li>
            </ul>

            <ul
              style={{
                fontSize: `${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                margin: '40px 0 0 0'
              }}
              // className={`${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'} mt-1 flex justify-between`}
            >
              <li>
                <div>
                  <span className=" font-bold">Date :</span>
                  <span>
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? invoiceDatas.customerdetails.date
                      : null}
                  </span>{' '}
                </div>
                <div className={`${quotationft.type === 'withoutGST' ? 'hidden' : 'inline-block'}`}>
                  <span className="font-bold">GSTIN :</span> 33AAIFN6367K1ZV
                </div>

                <div

                // className={`${invoiceDatas.customerdetails.customername === 'Quick Sale' || invoiceDatas.customerdetails.customername === undefined || gstin === false ? 'hidden' : 'block'}`}
                >
                  <span
                    className={`w-full font-bold ${invoiceDatas.customerdetails.customername === '' || invoiceDatas.customerdetails.customername === undefined ? 'hidden' : 'block'}`}
                  >
                    Customer Name :{' '}
                    <span className="font-medium">
                      {Object.keys(invoiceDatas.customerdetails).length !== 0
                        ? invoiceDatas.customerdetails.customername
                        : null}
                    </span>
                  </span>
                </div>

                <div
                  className={` ${invoiceDatas.customerdetails.boxnumber ? 'block' : 'hidden'}`}
                >
                  <span className="font-bold">Box Number :</span>{' '}
                  <span>
                    {invoiceDatas.customerdetails.boxnumber || 'N/A'}
                  </span>
                </div>

                <div
                  className={`${invoiceDatas.customerdetails.mobilenumber === '' || invoiceDatas.customerdetails.mobilenumber === undefined ? 'hidden' : 'block'}`}
                >
                  <span className="font-bold">Mobile Number : </span>{' '}
                  <span>{invoiceDatas.customerdetails.mobilenumber}</span>
                </div>

                <div className={`${gstin === true ? 'block' : 'hidden'}`}>
                  <div
                    className={` ${invoiceDatas.customerdetails.gstin !== '' ? 'block' : 'hidden'}`}
                  >
                    <span className="font-bold">Customer GSTIN :</span>{' '}
                    <span>
                      {invoiceDatas.customerdetails.gstin
                        ? invoiceDatas.customerdetails.gstin
                        : 'N/A'}
                    </span>
                  </div>
                  <div
                    className={` ${invoiceDatas.customerdetails.location !== '' ? 'block' : 'hidden'}`}
                  >
                    <span className="font-bold">Customer Address :</span>{' '}
                    <span>
                      {invoiceDatas.customerdetails.location
                        ? invoiceDatas.customerdetails.location
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </li>

              <li className="text-end flex flex-col items-end">
                <span>
                  {' '}
                  <span className="font-bold">Cell :</span> 7373674757
                </span>
                <span>9487369569</span>
              </li>
            </ul>

            <h2
              className={`${invoiceDatas.customerdetails.type === 'return' ? 'block' : 'hidden'} font-bold w-full text-center mt-[10px]`}
              style={{ fontSize: `${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}` }}
            >
              Return
            </h2>

            <table
              className="withoutgsttable"
              style={{
                fontSize: `${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}`,
                width: '100%',
                borderCollapse: 'collapse',
                margin: '10px 0px 0px 0px',
                textAlign: 'left',
                padding: '3px'
              }}
              // className={`${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'} min-w-full border-collapse mt-4`}
            >
              <thead>
                <tr>
                  <th
                  // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    S.No
                  </th>
                  <th
                    style={{ width: '350px' }}
                    // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Product
                  </th>
                  {/* <th
                    // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Flavour
                  </th>
                  <th
                    // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Size
                  </th> */}
                  <th
                  // style={{width:'100px'}}
                  // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Rate
                  </th>
                  <th
                  // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Qty
                  </th>
                  <th
                  // style={{width:'100px'}}
                  // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    MRP
                  </th>
                  <th
                    style={{ width: '50px' }}
                    // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Margin
                  </th>
                  <th
                  // style={{width:'100px'}}
                  // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b text-left pb-2`}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoiceDatas.data.length > 0
                  ? invoiceDatas.data.map((item, i) => (
                      <tr key={i}>
                        <td
                          width={20}
                          // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {i + 1}
                        </td>
                        <td
                        // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {item.productname}{' '}
                          {invoiceDatas.customerdetails.type === 'return' &&
                          (item.returntype !== undefined || item.returntype !== null)
                            ? `(${item.returntype})`
                            : ''}
                        </td>
                        {/* <td
                          // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {item.flavour}
                        </td>
                        <td
                          // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {item.quantity}
                        </td> */}
                        <td
                        // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {item.pieceamount}
                        </td>
                        <td
                        // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {item.numberofpacks}
                        </td>
                        <td
                        // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {item.producttotalamount}
                        </td>
                        <td
                        // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {toDigit(item.margin)}%
                        </td>
                        <td
                        // className={`${hasPdf === true ? 'text-[0.7rem]' : 'text-[0.5rem]'} border-b pb-2`}
                        >
                          {customRound(
                            item.numberofpacks * item.pieceamount -
                              (item.numberofpacks * item.pieceamount * item.margin) / 100
                          )}
                        </td>
                      </tr>
                    ))
                  : 'No Data'}
              </tbody>
            </table>

            <div
              style={{
                fontSize: `${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}`,
                textAlign: 'end',
                margin: '10px 0 0 0',
                // display: 'flex',
                // justifyContent:'space-between',
                // alignItems:'end'
              }}
            >
             {/* <p className={`text-start p-2 ${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}`}>Authorised Signature</p> */}
              <span
                style={{
                  fontSize: `${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}`,
                  // display: 'flex',
                  // justifyContent: 'space-between',
                  // alignItems: 'center',
                  // padding: '1px 0 0 0'
                }}
              >
                <p className={`${hasPdf === true ? pdfBillStyle.para : printBillStyle.para} ${invoiceDatas.customerdetails.partialamount !== 0 ? 'block text-end' : 'hidden'}`}>
                  Balance:{' '}
                  <span className=" font-bold">
                    {Object.keys(invoiceDatas.customerdetails).length !== 0
                      ? formatToRupee(
                          invoiceDatas.customerdetails.billamount -
                            invoiceDatas.customerdetails.partialamount
                        )
                      : null}
                    {/* {(Object.keys(invoiceDatas.customerdetails).length !== 0) && (invoiceDatas.customerdetails.partialamount !== 0 )
                  ? formatToRupee( invoiceDatas.customerdetails.billamount - invoiceDatas.customerdetails.partialamount)
                   : (Object.keys(invoiceDatas.customerdetails).length !== 0) && (invoiceDatas.customerdetails.partialamount === 0 && invoiceDatas.customerdetails.paymentstatus === 'Unpaid') ? formatToRupee(invoiceDatas.customerdetails.billamount) :0} */}
                  </span>
                </p>
              </span>
             
              {/* <p
            style={{
              padding:'50px 0 0 0',
              // textAlign:'left'
              }}
              // className={`text-end mt-10 p-2 ${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'}`}
            >
              Authorised Signature
            </p> */}

            <span>
             <p
              // className={`text-end mt-2 ${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'}`}
              >
                Total Amount:{' '}
                <span className=" font-bold">
                  {Object.keys(invoiceDatas.customerdetails).length !== 0
                    ? formatToRupee(invoiceDatas.customerdetails.total)
                    : null}
                </span>{' '}
              </p>
              <p
              // className={`text-end ${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'}`}
              >
                Bill Amount:{' '}
                <span className=" font-bold">
                  {Object.keys(invoiceDatas.customerdetails).length !== 0
                    ? formatToRupee(invoiceDatas.customerdetails.billamount)
                    : null}
                </span>
              </p>
              <p
                className={`${invoiceDatas.customerdetails.type === 'return' ? 'hidden' : 'block'}`}
                // className={`${hasPdf === true ? 'text-[0.8rem]' : 'text-[0.5rem]'} ${invoiceDatas.customerdetails.partialamount !== 0 || invoiceDatas.customerdetails.paymentstatus === 'Paid' ? 'block text-end' : 'hidden'}`}
              >
                Paid Amount:{' '}
                <span className=" font-bold">
                  {Object.keys(invoiceDatas.customerdetails).length !== 0
                    ? invoiceDatas.customerdetails.paymentstatus === 'Paid'
                      ? formatToRupee(invoiceDatas.customerdetails.billamount)
                      : formatToRupee(invoiceDatas.customerdetails.partialamount)
                    : null}
                </span>
              </p>
             </span>
             <p

className={`text-start mt-4 p-2 ${hasPdf === true ? pdfBillStyle.para : printBillStyle.para}`}
>
Authorised Signature
</p>
            </div>
          </section>
        </div>
      </div>
      {/* old pdf and print end */}

      {/* new start */}
      <div
        ref={GstBillRef}
        className="absolute top-[-200rem] w-full"
        style={{ padding: '20px', backgroundColor: '#ffff'}}
      >
        <span
          style={{
            fontSize: `${hasPdf === true ? GstBillStylePdf.subheading : GstBillStylePrint.subheading}`
          }}
          className="w-full block text-center font-bold"
        >
          TAX INVOICE
        </span>
        <div ref={GstComponentRef} className="w-full flex justify-center items-center">
          <section className="w-[90%] border mt-4">
            <ul
              style={{
                fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
              }}
              className={`px-2 flex justify-between `}
            >
              {/* phone number */}
              <li className="text-start flex flex-col ">
                    <span>
                      <span className="font-medium">Date &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160; :</span>{' '}
                      <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? invoiceDatas.customerdetails.createddate
                          : null}
                      </span>
                    </span>
                <span>
                  <span className="font-medium">Phone No &#160;&#160;&#160; :</span>{' '}
                  7373674757, 9487369569
                </span>
                <span>
                <span className="font-medium">
                  Invoice No &#160;&#160; :
                </span>{' '}
                    <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? invoiceDatas.customerdetails.id
                          : null}
                      </span>
                </span>
              </li>

              <li>
                <span className="font-medium">Email ID &#160; :</span>{' '}
                <span className="font-normal">saranya@gmail.com</span>
              </li>
            </ul>

            <ul className="flex justify-center items-center gap-x-2 border-b">
              <li className="text-center">
                <p
                  className="font-semibold text-[12px]"
                >
                  NEW SARANYA ICE COMPANY
                </p>{' '}
              </li>
            </ul>

            {/* grid -2 */}
            <ul className={`${hasPdf === true ? 'pb-2' : ''} px-2`}>
              <li
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
              >
                <span className="text-center block ">
                Factory Address : TC48/285, Pilavilai, Azhaganparai, Kanyakumari Dist, Pincode-629501
                </span>
              </li>
            </ul>

            <ul className={`${hasPdf === true ? 'pb-2' : ''} px-2 border-t`}>
              <li
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
              >
                <span className="text-center block ">
                Regd Office : 28/3030,Pilavilai,Azhaganparai,K.K.Dist-629501
                </span>
              </li>
            </ul>


            <table className="gsttable w-full">
              <thead>
                <tr>
                  <th
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={`${hasPdf === true ? 'pb-2' : ''} pl-2 font-medium`}
                  >
                    <span className="text-left block ">
                      GSTIN
                      &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:
                      33AAIFN6367K1ZV
                    </span>
                    <span className="text-left block ">
                      PAN No &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                      <span className="font-medium">33AAIFN6367K1ZV</span>
                    </span>
                  </th>

                  <th
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={`${hasPdf === true ? 'pb-2' : ''} font-medium`}
                  >
                    <span className="block">FSSAI No</span>
                    33AAIFN6367K1ZV
                  </th>

                  <th
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={`${hasPdf === true ? 'pb-2' : ''} font-medium`}
                  >
                    <span className="text-left block pl-2">
                      No &#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                      {invoiceDatas.customerdetails.id}
                    </span>
                    <span className="text-left block pl-2">
                      Date &#160;&#160;&#160;:{' '}
                      <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? invoiceDatas.customerdetails.date
                          : null}
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
            </table>


            {/* grid-3 */}
            <ul className="border-t grid grid-cols-2 ">
              {/* billed address */}
              <li className={`${hasPdf === true ? 'pb-2' : ''} border-r`}>
                <div className="px-2">
                  <span
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className="text-left block font-semibold"
                  >
                    Billed To{' '}
                  </span>
                  <address
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={`not-italic  `}
                  >
                    <span className={`font-semibold pl-2`}>New Saranya Ice Company</span> <br />
                    <span className={`font-medium block pl-4`}>
                      2-61/3 Pillavillai Azhaganparal Post <br />
                      Nagarcoil <br />
                      Kanyamukari Dist
                      <br />
                      Pincode: 628217.
                    </span>
                  </address>
                  <span
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={` font-medium mt-3 block`}
                  >
                    PAN NO &#160;&#160;&#160;&#160;&#160;&#160;&#160;: <br />
                    Batch Code &#160;&#160;:
                    <br />
                    GSTIN &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:
                    <br />
                  </span>
                </div>
              </li>
              {/* shipped address */}
              <li
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
                className={`${hasPdf === true ? 'pb-2' : ''}`}
              >
                <div className="px-2 flex flex-col justify-between">
                  <span className="text-left block font-semibold">Shipped To </span>
                  <address
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={`not-italic  `}
                  >
                    <span className={`font-semibold pl-2`}>
                      {Object.keys(invoiceDatas.customerdetails).length !== 0
                        ? invoiceDatas.customerdetails.customername
                        : null}
                    </span>{' '}
                    <br />
                    <span className={`font-medium block pl-4`}>
                      {Object.keys(invoiceDatas.customerdetails).length !== 0
                        ? invoiceDatas.customerdetails.location
                        : null}{' '}
                    </span>
                  </address>

                  <span
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={` font-medium  block`}
                  >
                    GSTIN &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                    <span className={`font-medium`}>
                      {Object.keys(invoiceDatas.customerdetails).length !== 0
                        ? invoiceDatas.customerdetails.gstin
                        : null}{' '}
                    </span>
                  </span>
                </div>
              </li>
            </ul>

            <section 
            style={{
              minHeight: hasPdf ? '42rem' : '26rem',
              overflowY: 'auto',
              pageBreakInside: 'avoid'
            }}
            //className={`${hasPdf ? "h-[42rem]" : "h-[26rem]"}`}
            >
              <table
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
                className={`gstitemtable min-w-full border-collapse ${hasPdf ? "pdf-padding" : ""}`}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={`${hasPdf === true ? 'pb-2' : ''} border-r w-[2rem]`}
                    >
                      S.No
                    </th>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={` border-b`}
                    >
                      Product
                    </th>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={` border-b`}
                    >
                      Rate
                    </th>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={` border-b`}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={` border-b`}
                    >
                      MRP
                    </th>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={` border-b`}
                    >
                      Discount
                    </th>
                    <th
                      style={{
                        fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                      }}
                      className={` border-b`}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceDatas.data.length > 0
                    ? invoiceDatas.data.map((item, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={`${hasPdf === true ? 'pb-2' : ''} border-b text-center`}
                          > 
                            {i + 1}
                          </td>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={` border-b px-1`}
                          >
                            {item.productname}{' '}
                            {invoiceDatas.customerdetails.type === 'return' &&
                            (item.returntype !== undefined || item.returntype !== null)
                              ? `(${item.returntype})`
                              : ''}
                          </td>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={` border-b text-center`}
                          >
                            {item.pieceamount}
                          </td>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={` border-b text-center`}
                          >
                            {item.numberofpacks}
                          </td>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={` border-b text-center`}
                          >
                            {item.producttotalamount}
                          </td>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={` border-b text-center`}
                          >
                            {toDigit(item.margin)}%
                          </td>
                          <td
                            style={{
                              fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                            }}
                            className={` border-b text-center`}
                          >
                            {customRound(
                              item.numberofpacks * item.pieceamount -
                                (item.numberofpacks * item.pieceamount * item.margin) / 100
                            )}
                          </td>
                        </tr>
                      ))
                    : 'No Data'}

                  <tr className='px-1'>
                    <td></td>
                    <td className='px-1'>Total</td>
                    <td></td>
                    <td></td>
                    <td className='px-1 text-center'>
                      <span className="font-bold">
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.total)
                          : null}
                      </span>
                    </td>
                  <td></td>
                    <td className='px-1 text-center'>
                      <span className=" font-bold">
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount)
                          : null}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <table
              style={{
                fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
              }}
              className={`gsttaxtable w-full ${hasPdf ? "pdf-padding" : ""}`}
            >
              <thead className="font-semibold">
                <tr className="font-semibold">
                  <th>HSN/SAC</th>
                  <th>Taxable Value</th>
                  <th colSpan="2">Central Tax</th>
                  <th colSpan="2">State Tax</th>
                  <th>Total Tax</th>
                </tr>
                <tr className="font-medium">
                  <th></th>
                  <th></th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Rate</th>
                  <th>Amount</th>
                  <th>Tax Amount</th>
                </tr>
              </thead>

              <tbody
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
                className={`gsttaxtable w-full text-center`}
              >
                <tr>
                  <td>19053453</td>
                  <td><span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount)
                          : null}
                      </span></td>
                  <td>9%</td>
                  <td><span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount * 0.09)
                          : null}
                      </span></td>
                  <td>9%</td>
                  <td><span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount * 0.09)
                          : null}
                      </span></td>
                </tr>
                <tr className="font-semibold">
                  <td></td>
                  <td>Total</td>
                  <td></td>
                  <td><span className=" font-semibold">
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount * 0.09)
                          : null}
                      </span></td>
                  <td></td>
                  <td><span className=" font-semibold">
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount * 0.09)
                          : null}
                      </span></td>
                  <td><span className=" font-semibold">
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount * 0.18)
                          : null}</span></td>
                </tr>
              </tbody>
            </table>

            {/* company bank detials */}
            <ul
              style={{
                fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
              }}
              className={` border-b w-full border-x grid grid-cols-2  `}
            >


                <li className={`${hasPdf === true ? 'pb-2' : ''} border-t border-r`}>
                <div className="px-2">
                  <span
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={`font-medium block`}
                  >
                    Distination &#160;&#160;: <span className={`font-semibold`}>
                      {Object.keys(invoiceDatas.customerdetails).length !== 0
                        ? invoiceDatas.customerdetails.location
                        : null}{' '}
                    </span>
                    <br />
                    Transport &#160;&#160;&#160;&#160;: 
                    <span className={`font-semibold`}>
                      {Object.keys(invoiceDatas.customerdetails).length !== 0
                        ? invoiceDatas.customerdetails.vehicleorfreezerno
                        : null}{' '}
                    </span>
                    <br />
                  </span>
                </div>
              </li>
              <li className={`w-full border-t text-right`}>
                <div className="px-2">
                  <span
                    style={{
                      fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                    }}
                    className={` font-medium  block`}
                  >
                    Total Sale Value : <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.total)
                          : null}
                      </span><br />
                    <span>
                      Bulk Discount :{' '}<span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.total - invoiceDatas.customerdetails.billamount)
                          : null}
                      </span>
                    </span>
                    <br />
                    Total : <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount)
                          : null}
                      </span>
                    <br />
                    GST @ 18% : <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount * 0.18)
                          : null}
                      </span><br />
                  </span>
                </div>
              </li> 

              <li className={`${hasPdf === true ? 'pb-2' : ''} px-2 border-t`}>
                <h2
                  style={{
                    fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                  }}
                  className="w-full font-semibold"
                >
                  Company's Bank Details
                </h2>
                Bank Name
                &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                <span className="font-medium">State Bank of India CC A/c</span> <br />
                A/c No
                &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                <span className="font-medium">0000039765825810</span>
                <br />
                Branch & IFS Code &#160;:{' '}
                <span className="font-medium">Srialsi SME Branch & SBIN003316</span>
                <br />
                UPI ID &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                <span className="font-medium">saranya@sbi</span>
                <br />
              </li>

              <li
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
                className={`px-2 border-l`}
              >
                <span className="block font-bold text-right pt-5"> Grand Total : <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount + invoiceDatas.customerdetails.billamount * 0.18)
                          : null}
                      </span></span>
              </li>
              
              <li
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
                className={`${hasPdf === true ? 'pb-2' : ''} px-2 border-t w-full`}
              >
                <p className={`font-semibold ${hasPdf === true ? 'text-[12px]' : 'text-[10px]'}`}>Declaration & Terms Of Delivery</p>
                <p className='text-[7px]'>1 Billing Is Ex-Works.Claims for Shortage and Defective Goods Will Not Be Entertained After Delivery.</p>
                <p className='text-[7px]'>2 All Transportation Via Buyer Vehicle Is Cost to Buyers Accounts.All Damages/risks After Delivery at Factory Premises to Buyers Accounts</p>
                <p className='text-[7px]'>3 All Taxes/levis/penalites/compounding Fees Etc Imposed Post Delivery to the Buyers Accounts.</p>
                <p className='text-[7px]'>4 Name of the Commodity- IC = Medium fat Ice cream,FD = Medium fat frozen dessert,LG=High fat ice cream,IL=Ice lolly,IN=ice candy</p>
                <p className='text-[7px]'>5 We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
              </li>

              <li
                style={{
                  fontSize: `${hasPdf === true ? GstBillStylePdf.para : GstBillStylePrint.para}`
                }}
                className={`${hasPdf === true ? 'pb-2' : ''} px-2  border-l border-t`}
              >
                Checked by <span className='font-semibold'>NEW SARANYA ICE COMPANY</span>
                <span className="block text-right pt-14"> Authorised Signature </span>
              </li>

            </ul>
          </section>
        </div>
      </div>
      {/* new end */}

      <ul>
        <li className="flex gap-x-3 items-center justify-end">
          <RangePicker
            className="w-[16rem]"
            onChange={handleDateChange}
            defaultValue={[today, today]}
            format="DD/MM/YYYY"
          />
          <Button
            type="primary"
            onClick={() => {
              setQuotationModalOpen(true)
              form.resetFields()
            }}
          >
            Quotation <FaRegFilePdf />
          </Button>
        </li>

        <ul className="card-list mt-2 grid grid-cols-4 gap-x-2 gap-y-2">
          {cardsData.map((card) => {
            const isActive = activeCard === card.key
            return (
              <div>
                {card.key === 'totalPaid' ? (
                  <Card
                    style={{
                      cursor: 'pointer',
                      borderColor: isActive ? '#f26723' : card.value > 0 ? '#3f8600' : '#cf1322',
                      borderWidth: 2,
                      background: isActive ? '#f26723' : '',
                      color: isActive ? '#ffffff' : '#3f8600'
                    }}
                    tabList={tabListNoTitle}
                    activeTabKey={activeTabKey2}
                    onClick={() => {
                      handleCardClick(card.key)
                      let el = document.querySelectorAll('.ant-tabs-tab-btn')
                      let activeel = document.querySelector('.ant-tabs-tab-active')
                      if (el) {
                        el.forEach((data) => {
                          data.classList.add('active-text-white')
                        })
                      }
                    }}
                    onTabChange={onTab2Change}
                    tabProps={{
                      size: 'middle'
                    }}
                  >
                    {contentListNoTitle[activeTabKey2]}
                  </Card>
                ) : (
                  <Card
                    key={card.key}
                    onClick={() => {
                      handleCardClick(card.key)
                      let el = document.querySelectorAll('.ant-tabs-tab-btn')
                      if (el) {
                        el.forEach((data) => {
                          data.classList.remove('active-text-white')
                        })
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      borderColor: isActive ? '#f26723' : card.value > 0 ? '#3f8600' : '#cf1322',
                      borderWidth: 2,
                      background: isActive ? '#f26723' : '',
                      color: isActive ? '#ffffff' : ''
                    }}
                  >
                    <div className="flex flex-col">
                      <div className="flex justify-between">
                        <Statistic
                          title={
                            isActive ? (
                              <span className="text-white">{card.title}</span>
                            ) : (
                              <span>{card.title}</span>
                            )
                          }
                          value={card.value}
                          precision={card.key === 'totalBooking' ? 0 : 2}
                          valueStyle={{
                            color: isActive ? '#ffffff' : card.value > 0 ? '#3f8600' : '#cf1322'
                          }}
                          prefix={card.prefix}
                        />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )
          })}
        </ul>

        <li className="mt-2">
          <Table
            virtual
            scroll={{ x: 900, y: tableHeight }}
            pagination={false}
            dataSource={selectedTableData}
            columns={columns}
            loading={tableLoading}
            rowKey="id"
          />
        </li>
      </ul>

      <Modal
        title="Items"
        centered={true}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setSelectedRecord(null);
        }}
        width={800}
        footer={null}
      >
        {selectedRecord && (
          <div>
            <Descriptions size="small" bordered column={2}>
              <Descriptions.Item label="Customer">{selectedRecord.customername}</Descriptions.Item>
              <Descriptions.Item label="Date">{selectedRecord.date}</Descriptions.Item>
              <Descriptions.Item label="Gross Amount">{selectedRecord.total}</Descriptions.Item>
              <Descriptions.Item label="Net Amount">{selectedRecord.billamount}</Descriptions.Item>
              {selectedRecord.mobilenumber && (
                <Descriptions.Item label="Mobile">{selectedRecord.mobilenumber}</Descriptions.Item>
              )}
              {selectedRecord.location && (
                <Descriptions.Item label="Location">{selectedRecord.location}</Descriptions.Item>
              )}
            </Descriptions>
            <div className="mt-2">
              <Table
                dataSource={selectedRecord.items}
                columns={itemColumns}
                pagination={false}
                rowKey={(item) => item.id + '-' + item.sno}
                // virtual
                scroll={{y:450}}
              />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        className="relative"
        centered={true}
        width={1100}
        title={
          <span className="w-full flex justify-center items-center text-sm py-2">QUOTATION</span>
        }
        open={quotationModalOpen}
        onCancel={() => {
          if (quotationft.tempproduct.length > 0) {
            setWarningModal(true)
          } else {
            setQuotationModalOpen(false)
          }
        }}
        footer={
          <div>
            <section className="flex gap-x-3 justify-between items-center">
              <span className="flex gap-x-3 m-0 justify-center items-center">
                <Form
                  className="flex gap-x-2 justify-center items-center"
                  form={marginform}
                  onFinish={(value) => marginOnchange(value)}
                >
                  <Form.Item
                    className="mb-0"
                    name="marginvalue"
                    rules={[{ required: true, message: false }]}
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      type="number"
                      className="w-[11.5rem]"
                      prefix={<span>Margin(%)</span>}
                    />
                  </Form.Item>
                  <Form.Item className="mb-0">
                    <Button type="primary" htmlType="submit">
                      Enter
                    </Button>
                  </Form.Item>
                </Form>
              </span>

              <span className="flex gap-x-3 justify-center items-center">
                {/* <Button  disabled={quotationft.tempproduct.length > 0 ? false : true} type="primary" className=" w-fit" onClick={() => handleQuotationPrint()}>
                <PrinterOutlined />Print 
                </Button> */}
                <ReactToPrint
                  trigger={() => (
                    <Button
                      type="primary"
                      disabled={quotationft.tempproduct.length > 0 ? false : true}
                    >
                      <PrinterOutlined /> Print
                    </Button>
                  )}
                  onBeforeGetContent={async () => {
                    setGstBillPdf(false)

                    setHasPdf(false)

                    return new Promise((resolve) => {
                      promiseResolveRef.current = resolve
                      handleQuotationPrint().then(() => {
                        setIsPrinting(true)
                      })
                    })
                  }}
                  content={() => componentRef.current}
                  onAfterPrint={() => {
                    promiseResolveRef.current = null
                    setIsPrinting(false)
                  }}
                />
                <Popconfirm
                  title="Sure to download pdf?"
                  onConfirm={() => handleQuotationDownload()}
                >
                  <Button
                    type="primary"
                    disabled={quotationft.tempproduct.length > 0 ? false : true}
                  >
                    <DownloadOutlined size={20} /> Download
                  </Button>
                </Popconfirm>

                {/* <Button  type="primary" className=" w-fit" onClick={() => handleQuotationDownload()}>
                  <DownloadOutlined />
                </Button> */}
              </span>
            </section>
          </div>
        }
      >
        <div className="relative">
          <div className="grid grid-cols-4 gap-x-2">
           
            <span className="col-span-1">
              <Form
                form={form}
                layout="vertical"
                onFinish={addTempProduct}
                initialValues={{ date: dayjs(), type: 'withGST' }}
              >
                <Form.Item
                  className="mb-3 absolute top-[-2.7rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
                </Form.Item>
                <Form.Item name="type" className="mb-1 mt-3">
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                    onChange={(e) => {
                      setQuotationFt((pre) => ({ ...pre, type: e.target.value }))
                      // setQuotationData(pre=>({...pre,type:e.target.value}))
                      // form.resetFields(['productname','flavour','quantity', 'numberofpacks',]);
                      marginform.resetFields(['marginvalue'])
                    }}
                  >
                    <Radio.Button value="withGST" style={{ width: '50%' }}>
                      With GST
                    </Radio.Button>
                    <Radio.Button value="withoutGST" style={{ width: '50%' }}>
                      Without GST
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
                <Form.Item
                  className="mt-5"
                  name="productname"
                  label="Product Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    onChange={(value, i) => productOnchange(value, i)}
                    showSearch
                    placeholder="Select the Product"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.product}
                  />
                </Form.Item>
                {/* <Form.Item
                  className="mb-1"
                  name="flavour"
                  label="Flavour"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    disabled={option.flavourstatus}
                    onChange={(value, i) => flavourOnchange(value, i)}
                    showSearch
                    placeholder="Select the Flavour"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.flavour}
                  />
                </Form.Item>
                <Form.Item
                  className="mb-1"
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    disabled={option.quantitystatus}
                    showSearch
                    placeholder="Select the Quantity"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.quantity}
                  />
                </Form.Item> */}
                <Form.Item
                  // className="mb-3 mt-0"
                  name="numberofpacks"
                  label="Number of Pieces"
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber
                    type="number"
                    min={1}
                    className="w-full"
                    placeholder="Enter the Number"
                  />
                </Form.Item>
                <span className="absolute flex justify-center items-center left-[18rem] bottom-[-3.1rem] gap-x-2">
                  <Form.Item className="mb-1" name="customername">
                    <Input
                      onChange={(e) =>
                        debounce(setQuotationFt((pre) => ({ ...pre, customername: e.target.value })),300)
                      }
                      placeholder="Customer Name"
                    />
                  </Form.Item>

                  <Form.Item
                    className="mb-1"
                    name="mobilenumber"
                    // label="Mobile Number"
                  >
                    <InputNumber
                      type="number"
                      onChange={(e) => setQuotationFt((pre) => ({ ...pre, mobilenumber: e }))}
                      placeholder="Mobile No"
                      className="w-full"
                      min={0}
                    />
                  </Form.Item>
                </span>
                <div className="mb-3 w-full">
                  <Button className="w-full" type="primary" htmlType="submit">
                    Add To List
                  </Button>
                </div>
              </Form>
            </span>

            {/* <Table
                virtual
                columns={quotationColumns}
                // components={{ body: { cell: EditableCellTem } }}
                pagination={{ pageSize: 4 }}
                className="col-span-3"
                dataSource={option.tempproduct}
                scroll={{ x: false, y: false }}
              /> */}

            <span className="col-span-3">
              <Form
                form={temform}
                component={false}
                //  onFinish={tempSingleMargin}
              >
                <Table
                  virtual
                  columns={tempMergedColumns}
                  components={{ body: { cell: EditableCellTem } }}
                  dataSource={quotationft.tempproduct}
                  // pagination={{ pageSize: 4 }}
                  pagination={false}
                  scroll={{ x: false, y: quotationTableHeight }}
                />
              </Form>
            </span>
          </div>

          <span
            className={`absolute top-[-2.7rem] right-10 ${option.margin === 0 ? 'hidden' : 'block'}`}
          >
            <Tag color="blue">
              MRP Amount:{' '}
              <span className="text-sm">{formatToRupee(quotationft.mrpamount, true)}</span>
            </Tag>
            <Tag color="green">
              Net Amount:{' '}
              <span className="text-sm">{formatToRupee(quotationft.totalamount, true)}</span>
            </Tag>
          </span>
        </div>
      </Modal>
      <WarningModal state={warningModal} cancel={warningModalCancel} ok={warningModalok} />
    </div>
  )
}
