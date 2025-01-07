import React, { useEffect, useState } from 'react'
import {
  Button,
  Input,
  Table,
  Modal,
  Form,
  InputNumber,
  Typography,
  Popconfirm,
  message,
  Select,
  Radio,
  DatePicker,
  Tag,
  Spin,
  Tooltip,
  Badge,
  Popover,
  Empty
} from 'antd'
import { debounce } from 'lodash'
import { SolutionOutlined } from '@ant-design/icons'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import dayjs from 'dayjs'
import { formatToRupee } from '../js-files/formate-to-rupee'
const { Search, TextArea } = Input
import { PiWarningCircleFill } from 'react-icons/pi'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { truncateString } from '../js-files/letter-length-sorting'
import { BsBox2 } from 'react-icons/bs'
import { IoCloseCircle } from 'react-icons/io5'
import { BsBoxSeam } from 'react-icons/bs'
import { compareArrays } from '../js-files/compare-two-array-of-object'
import './css/CustomerList.css'
import TableHeight from '../components/TableHeight'
// APIs
import {
  addCustomer,
  updateCustomer,
  getCustomerById,
  addCustomerPayment,
  getCustomerPaymentsById,
  updateCustomerPayment
} from '../sql/customer'
import { addFreezerbox, updateFreezerbox, getFreezerboxById } from '../sql/freezerbox'

export default function CustomerList({ datas, customerUpdateMt, freezerboxUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [freezerform] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const [isPayModelOpen, setIsPayModelOpen] = useState(false)
  const [isPayDetailsModelOpen, setIsPayDetailsModelOpen] = useState(false)
  const [customerPayId, setCustomerPayId] = useState(null)
  const [payDetailsData, setPayDetailsData] = useState([])
  const [isVehicleNoDisabled, setIsVehicleNoDisabled] = useState(true)
  const [customerTbLoading, setCustomerTbLoading] = useState(true)
  const [totalReturnAmount, setTotalReturnAmount] = useState(0)
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0)
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0)
  const [totalBalanceAmount, setTotalBalanceAmount] = useState(0)
  const [transportOnchange, setTransportOnchange] = useState('Self')

  // side effect
  useEffect(() => {
    setCustomerTbLoading(true)
    const filteredData = datas.customers.map((item, index) => ({
      ...item,
      sno: index + 1,
      key: item.id || index
    }))

    let compainData = filteredData.map((customer) => {
      let getvalue = datas.freezerbox
        .filter((fz) => customer.id === fz.customerId)
        .map((data) => ({ boxNumber: data.boxNumber, id: data.id }))
      return { ...customer, freezerbox: getvalue }
    })
    setData(compainData)
    setCustomerTbLoading(false)
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

  const [searchTextModal, setSearchTextModal] = useState('')
  const [tempSearchText, setTempSearchText] = useState('')

  const onPayDetailsSearchChange = (e) => {
    setTempSearchText(e.target.value)
    if (e.target.value === '') {
      setSearchTextModal('')
    }
  }
  const handlePayDetailsSearch = (value) => {
    console.log(payDetailsData)
    setSearchTextModal(value.trim())
  }

  const [isNewCustomerLoading, setIsNewCustomerLoading] = useState(false)
  // create new project
  const createNewProject = async (values) => {
    let { boxnumbers, ...newvalue } = values
    boxnumbers = boxnumbers || []
    setIsNewCustomerLoading(true)
    console.log(values)
    try {
      let result = await addCustomer({
        ...newvalue,
        name: values.name,
        transportationType: values.transportationType,
        address: values.address,
        gstin: values.gstin || '',
        vehicleOrFreezerNo: values.vehicleOrFreezerNo || '',
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        isDeleted: 0
      })

      if (boxnumbers.length > 0 && boxnumbers) {
        boxnumbers.forEach(async (box) => {
          const existingBox = await getFreezerboxById(box);
          await updateFreezerbox(box, {
            boxNumber: existingBox.boxNumber,
            customerId: result.id
          })
          await freezerboxUpdateMt()
        })
      } else {
        console.log('No')
      }

      await customerUpdateMt()

      message.open({ type: 'success', content: 'Customer Added Successfully' })
    } catch (e) {
      console.log(e)
      message.open({ type: 'error', content: `${e} Customer Added Unsuccessfully` })
    } finally {
      form.resetFields()
      setIsModalOpen(false)
      setIsNewCustomerLoading(false)
      setCustomerOnchange({
        name: '',
        payamount: ''
      })
    }
  }

  const showPayModal = (record) => {
    setCustomerName(record.name)
    payForm.resetFields()
    setCustomerPayId(record.id)
    setIsPayModelOpen(true)
  }

  const [isCustomerPayLoading, setIsCustomerPayLoading] = useState(false)

  const customerPay = async (value) => {
    setIsCustomerPayLoading(true)
    let { date, description, ...Datas } = value
    let formatedDate = dayjs(date).format('YYYY-MM-DD')
    const payData = {
      ...Datas,
      collectionType: 'customer',
      date: formatedDate,
      customerId: customerPayId,
      decription: description || '',
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      isDeleted: 0
    }
    try {
      // const customerDocRef = doc(db, 'customer', customerPayId)
      // const payDetailsRef = collection(customerDocRef, 'paydetails')
      // await addDoc(payDetailsRef, payData)
      console.log(payData)
      await addCustomerPayment(payData)
      message.open({ type: 'success', content: 'Pay Added Successfully' })
    } catch (e) {
      console.log(e)
    } finally {
      payForm.resetFields()
      setCustomerPayId(null)
      setIsPayModelOpen(false)
      setIsCustomerPayLoading(false)
      setCustomerOnchange({
        name: '',
        payamount: ''
      })
    }
  }

  const [customerName, setCustomerName] = useState('')

  const showPayDetailsModal = async (record) => {
    setCustomerName(record.name)
    try {
      const payDetailsResponse = await getCustomerPaymentsById(record.id)

      let payDetails = []
      if (payDetailsResponse) {
        payDetails = payDetailsResponse.filter((data) => !data.isDeleted)
      }
      const deliveryDocRef = await datas.delivery
        .filter((item) => !item.isDeleted && item.customerId === record.id)
        .map((data) => ({ ...data, name: record.name }))

      const combinedData = payDetails.concat(deliveryDocRef)
      let sortedData = await latestFirstSort(combinedData)

      // setPayDetailsData(sortedData)
      console.log('Comb', sortedData)
      // const addFreezerboxNumber = await Promise.all(
      //   combinedData.map(async data => {
      //     const { freezerbox, status } = await getFreezerboxById(data.boxid);
      //     return { ...data, boxNumber: freezerbox ? freezerbox.boxNumber : ''};
      //   })
      // );

      setPayDetailsData(sortedData)

      const totalPurchase = combinedData.reduce((total, item) => {
        if (item.type === 'order') {
          return total + (Number(item.billamount) || 0)
        }
        return total
      }, 0)
      setTotalPurchaseAmount(totalPurchase)

      const totalReturn = combinedData.reduce((total, item) => {
        if (item.type === 'return') {
          return total + (Number(item.billamount) || 0)
        }
        return total
      }, 0)
      setTotalReturnAmount(totalReturn)

      const totalPayment = combinedData.reduce((total, item) => {
        if (item.type === 'order') {
          if (item.paymentstatus === 'Paid') {
            return total + (Number(item.billamount) || 0)
          } else if (item.paymentstatus === 'Partial') {
            return total + (Number(item.partialamount) || 0)
          }
        } else if (item.type === 'Payment') {
          return total + (Number(item.amount) || 0)
        }
        return total
      }, 0)
      setTotalPaymentAmount(totalPayment)

      const totalBalance = combinedData.reduce((total, item) => {
        const billAmount = Number(item.billamount) || 0
        const partialAmount = Number(item.partialamount) || 0
        const paymentAmount = Number(item.amount) || 0
        if (item.type === 'order') {
          if (item.paymentstatus === 'Unpaid') {
            return total + billAmount
          } else if (item.paymentstatus === 'Partial') {
            return total + (billAmount - partialAmount)
          }
        } else if (item.type === 'return') {
          return total - billAmount
        } else if (item.type === 'Payment') {
          return total - paymentAmount
        }
        return total
      }, 0)
      setTotalBalanceAmount(totalBalance)
    } catch (e) {
      console.log(e)
    }
    setIsPayDetailsModelOpen(true)
  }

  const payDetailsColumns = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50,
      render: (record, _, i) => <span>{i + 1}</span>
    },

    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => {
        const dateA = dayjs(a.date, 'DD/MM/YYYY')
        const dateB = dayjs(b.date, 'DD/MM/YYYY')
        return dateA.isAfter(dateB) ? 1 : -1
      },
      defaultSortOrder: 'descend',
      width: 115
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'payment',
      render: (_, record) => {
        if (record.amount !== undefined) {
          if (record.type === 'Payment') {
            return formatToRupee(record.amount, true)
          }
        } else {
          return formatToRupee(record.billamount, true)
        }
        return null
      },
      width: 120
    },
    {
      title: 'Spend',
      dataIndex: 'amount',
      key: 'spend',
      render: (_, record) => {
        if (record.amount !== undefined && record.type === 'Spend') {
          return formatToRupee(record.amount, true)
        }
        return null
      },
      width: 100
    },
    {
      title: 'Advance',
      dataIndex: 'amount',
      key: 'advance',
      render: (_, record) => {
        if (record.amount !== undefined) {
          if (record.type === 'Advance') {
            return formatToRupee(record.amount, true)
          }
        }
      },
      width: 100
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (_, record) => {
        return record.type === undefined ? (
          <Tag color="green">Pay</Tag>
        ) : record.type === 'order' ? (
          <span className="flex">
            <Tag color="green">Order</Tag>{' '}
            <Tag className={`${record.boxNumber === '' ? 'hidden' : 'inline-block'}`}>
              {record.boxNumber}
            </Tag>{' '}
          </span>
        ) : record.type === 'return' ? (
          <span className="flex">
            <Tag color="red">Return</Tag>
            <Tag className={`${record.boxNumber === '' ? 'hidden' : 'inline-block'}`}>
              {record.boxNumber}
            </Tag>
          </span>
        ) : (
          <></>
        )
      },
      width: 150
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      render: (_, record) => {
        return record.paymentstatus === undefined ? (
          <>
            {record.type === 'Balance' ? (
              <Tag color="orange">Book</Tag>
            ) : (
              <Tag color="cyan">{record.paymentMode}</Tag>
            )}
          </>
        ) : record.paymentstatus === 'Paid' ? (
          <span className="flex items-center">
            <Tag color="green">Paid</Tag>
            {record.paymentMode && <Tag color="cyan">{record.paymentMode}</Tag>}
          </span>
        ) : record.paymentstatus === 'Unpaid' ? (
          <Tag color="red">UnPaid</Tag>
        ) : record.paymentstatus === 'Partial' ? (
          <span className="flex  items-center">
            <Tag color="yellow">Partial</Tag>{' '}
            <Tag color="blue" className="text-[0.7rem]">
              {formatToRupee(record.partialamount, true)}
            </Tag>
            {record.paymentMode && <Tag color="cyan">{record.paymentMode}</Tag>}
          </span>
        ) : (
          <></>
        )
      },
      width: 170
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) => {
        return record.description ? record.description : ''
      }
    }
  ]

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.name).toLowerCase().includes(value.toLowerCase()) ||
          String(record.transportationType).toLowerCase().includes(value.toLowerCase()) ||
          String(record.address).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobileNumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.gstin).toLowerCase().includes(value.toLowerCase()) ||
          String(record.vehicleOrFreezerNo).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      editable: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Transport',
      dataIndex: 'transportationType',
      key: 'transportationType',
      editable: true,
      sorter: (a, b) => a.transportationType.localeCompare(b.transportationType),
      showSorterTooltip: { target: 'sorter-icon' },
      width: 139
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      editable: true,
      width: 136
    },
    {
      title: 'GSTIN ',
      dataIndex: 'gstin',
      key: 'gstin',
      width: 140,
      editable: true,
      render: (text, record) => {
        return text.length > 10 ? <Tooltip title={text}>{truncateString(text, 10)}</Tooltip> : text
      }
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      editable: true,
      sorter: (a, b) => a.address.localeCompare(b.address),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text, record) => {
        return text.length > 10 ? <Tooltip title={text}>{truncateString(text, 10)}</Tooltip> : text
      }
    },
    // {
    //   title: 'Vehicle',
    //   dataIndex: 'vehicleOrFreezerNo',
    //   key: 'vehicleOrFreezerNo',
    //   editable: true,
    //   sorter: (a, b) => a.address.localeCompare(b.address),
    //   showSorterTooltip: { target: 'sorter-icon' },
    //   render: (text,record)=>{
    //     return text.length > 10 ? <Tooltip title={text}>{truncateString(text,10)}</Tooltip> : text
    //   }
    // },
    {
      title: 'Number',
      // title: 'Freezer Box',
      dataIndex: 'vehicleOrFreezerNo',
      key: 'vehicleOrFreezerNo',
      width: 120,
      // editable: true,
      render: (text, record) => {
        let freezerboxCount = record.freezerbox.length
        // return text.length > 12 ? <Tooltip title={text}>{truncateString(text,12)}</Tooltip> : text
        return (
          <>
            {record.transportationType === 'Company' ? (
              <Tooltip title={record.vehicleOrFreezerNo}>
                {truncateString(record.vehicleOrFreezerNo, 10)}
              </Tooltip>
            ) : record.transportationType === 'Freezer Box' ? (
              <Badge size="small" count={freezerboxCount}>
                <Button
                  onClick={() => setFreezerBox((pre) => ({ ...pre, popupid: record.id }))}
                  className="h-[1.7rem]"
                >
                  <BsBoxSeam />
                </Button>
                <Popover
                  content={
                    <div>
                      {freezerboxCount === 0 ? (
                        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
                      ) : (
                        record.freezerbox.map((data, i) => {
                          return (
                            <span>
                              {i + 1}.{data.boxNumber}
                              <br />{' '}
                            </span>
                          )
                        })
                      )}
                      <IoCloseCircle
                        onClick={() => setFreezerBox((pre) => ({ ...pre, popupid: null }))}
                        color="red"
                        size={20}
                        className="absolute right-2 top-2 cursor-pointer"
                      />
                    </div>
                  }
                  title="Freezer Box"
                  trigger="click"
                  open={freezerBox.popupid === record.id} // Open only for the clicked row
                  onOpenChange={(visible) => {
                    if (visible) {
                      setFreezerBox((pre) => ({ ...pre, popupid: record.id }))
                    } else {
                      setFreezerBox((pre) => ({ ...pre, popupid: null }))
                    }
                  }}
                ></Popover>
              </Badge>
            ) : (
              '-'
            )}
          </>
        )
      }
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 230,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <span className="flex gap-x-1 justify-center items-center">
            <Typography.Link
              onClick={() => save(record)}
              style={{
                marginRight: 8
              }}
            >
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-2 justify-center items-center">
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              onClick={() => showPayModal(record)}
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
            >
              Pay
              <MdOutlinePayments />
            </Button>
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              onClick={() => showPayDetailsModal(record)}
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
            >
              <SolutionOutlined />
            </Button>
            <Typography.Link
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              // onClick={() => edit(record)}
              onClick={() => {
                setUpdateCustomerDetails({ isclick: true, data: record })
                setIsModalOpen(true)
                form.setFieldsValue({
                  name: record.name,
                  transportationType: record.transportationType,
                  vehicleOrFreezerNo: record.vehicleOrFreezerNo,
                  boxnumbers: record.freezerbox.map((data) => ({
                    label: data.boxNumber,
                    value: data.id
                  })),
                  mobileNumber: record.mobileNumber,
                  gstin: record.gstin,
                  address: record.address
                })
                setTransportOnchange(record.transportationType)
                console.log(record.freezerbox)
              }}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
            <Popconfirm
              placement="left"
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => deleteProduct(record)}
            >
              <AiOutlineDelete
                className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = dataIndex === 'mobileNumber' ? <InputNumber type="number" /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'transportationType' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="transportationType"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select transportationType"
                    optionFilterProp="label"
                    options={[
                      { value: 'Self', label: 'Self' },
                      { value: 'Company', label: 'Company' },
                      { value: 'Freezer Box', label: 'Freezer Box' },
                      { value: 'Mini Box', label: 'Mini Box' }
                    ]}
                  />
                </Form.Item>
              </span>
            ) : dataIndex === 'mobileNumber' ? (
              <Form.Item
                name="mobileNumber"
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                <InputNumber maxLength={10} type="number" />
              </Form.Item>
            ) : (
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[
                  {
                    required:
                      dataIndex === 'name' ||
                      dataIndex === 'transportationType' ||
                      dataIndex === 'mobileNumber' ||
                      dataIndex === 'address'
                        ? true
                        : false,
                    message: false,
                    whitespace: true
                  }
                ]}
              >
                <Input />
              </Form.Item>
            )}
          </>
        ) : (
          children
        )}
      </td>
    )
  }

  const isEditing = (record) => editingKeys.includes(record.key)

  const edit = (record) => {
    form.setFieldsValue({ ...record })
    setEditingKeys([record.key])
  }

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'mobileNumber' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    }
  })

  const cancel = () => {
    setEditingKeys([])
  }

  const save = async (key) => {
    try {
      const row = await form.validateFields()
      setCustomerTbLoading(true)
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (
        index != null &&
        row.name === key.name &&
        row.transportationType === key.transportationType &&
        row.address === key.address &&
        row.vehicleOrFreezerNo === key.vehicleOrFreezerNo &&
        row.mobileNumber === key.mobileNumber &&
        row.gstin === key.gstin
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateCustomer(key.id, { ...row })
        customerUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    } finally {
      setCustomerTbLoading(false)
    }
  }

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const onSelectChange = (newSelectedRowKeys) => {
    setSelectedRowKeys(newSelectedRowKeys)
  }

  const rowSelection = {
    selectedRowKeys,
    columnWidth: 50,
    onChange: onSelectChange,
    selections: [
      Table.SELECTION_ALL,
      Table.SELECTION_INVERT,
      Table.SELECTION_NONE,
      {
        key: 'odd',
        text: 'Select Odd Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = []
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 !== 0) {
              return false
            }
            return true
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      },
      {
        key: 'even',
        text: 'Select Even Row',
        onSelect: (changeableRowKeys) => {
          let newSelectedRowKeys = []
          newSelectedRowKeys = changeableRowKeys.filter((_, index) => {
            if (index % 2 === 0) {
              return false
            }
            return true
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      }
    ]
  }

  // Table Height Auto Adjustment (***Do not touch this code***)
  const [tableHeight, setTableHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 100 // Adjust this value based on your layout needs
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

  const [historyHeight, setHistoryHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 300 // Adjust this value based on your layout needs
      setHistoryHeight(newHeight)
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

  const [freezerBoxHeight, setFreezerBoxHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 300 // Adjust this value based on your layout needs
      setFreezerBoxHeight(newHeight)
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

  // delete
  const deleteProduct = async (data) => {
    // await deleteproduct(data.id);
    const { id, ...newData } = data

    let paydetails = await getCustomerPaymentsById(data.id)
    console.log(data, paydetails)
    if (paydetails.length > 0) {
      paydetails.map(async (paydata) => {
        await updateCustomerPayment(id, paydata.id, { isDeleted: 1 })
      })
    }

    await updateCustomer(id, {
      isDeleted: 1
    })

    // remove freezerbox customerId:''
    if (newData.freezerbox.length > 0) {
      let boxIds = await datas.freezerbox
        .filter((fz) => newData.freezerbox.some((box) => box.boxNumber === fz.boxNumber))
        .map((box) => ({ id: box.id, boxNumber: box.boxNumber }))
      boxIds.forEach(async (box) => {
        await updateFreezerbox(box.id, { boxNumber: box.boxNumber, customerId: null })
        await freezerboxUpdateMt()
      })
    }
    await customerUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const excelDatas = exportDatas.map((pr, i) => ({
      No: i + 1,
      Customer: pr.name,
      Mobile: pr.mobileNumber,
      GSTIN: pr.gstin || '',
      Location: pr.address,
      Transport: pr.transportationType,
      Vehicle: pr.vehicleOrFreezerNo || ''
    }))
    jsonToExcel(excelDatas, `Customer-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKeys('')
  }

  const handleTransportChange = (value) => {
    if (value === 'Self') {
      setIsVehicleNoDisabled(true)
    } else {
      setIsVehicleNoDisabled(false)
    }
  }

  // warning modal methods
  const [isCloseWarning, setIsCloseWarning] = useState(false)
  const [customerOnchange, setCustomerOnchange] = useState({
    name: '',
    payamount: ''
  })

  const warningModalOk = () => {
    setIsModalOpen(false)
    form.resetFields()
    setIsCloseWarning(false)
    setCustomerOnchange({
      name: '',
      payamount: ''
    })
    setIsPayModelOpen(false)
  }

  const customerOnchangeMt = debounce((e, input) => {
    if (input === 'name') {
      setCustomerOnchange({
        name: e.target.value,
        payamount: ''
      })
    } else {
      setCustomerOnchange({
        name: '',
        payamount: e
      })
    }
  }, 200)

  const [freezerBox, setFreezerBox] = useState({
    modal: false,
    frommodal: false,
    onchangevalue: '',
    editclick: false,
    freezername: '',
    editid: '',
    spinner: false,
    tabledata: [],
    name: '',
    update: false,
    popupid: null
  })

  // create freezer box
  const CreateNewFreezerBox = async () => {
    let boxNumber = freezerform.getFieldsValue().boxNumber
    try {
      let checkExsistingBox = datas.freezerbox.some(
        (box) =>
          box.boxNumber && boxNumber && String(box.boxNumber).trim() === String(boxNumber).trim()
      )
      if (checkExsistingBox) {
        return message.open({ type: 'warning', content: 'The box name is already exsist' })
      } else {
        setFreezerBox((pre) => ({ ...pre, spinner: true }))
        let newFreezerData = {
          ...freezerform.getFieldsValue(),
          isDeleted: 0,
          createdDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString()
        }
        console.log(newFreezerData)
        await addFreezerbox(newFreezerData)
        message.open({ type: 'success', content: 'Freezerbox created successfully' })
        await freezerboxUpdateMt()
        setFreezerBox((pre) => ({ ...pre, frommodal: false }))
        setFreezerBox((pre) => ({ ...pre, spinner: false }))
      }
    } catch (e) {
      console.log(e)
      message.open({ type: 'error', content: `${e} create freezerbox successfully` })
    }
  }

  // useEffect(()=>{
  // async function updateData(){
  //  await setFreezerBox(pre=>({...pre,spinner:true}));
  //   let freezerBoxData = await datas.freezerbox.filter(box => box.isDeleted === false).map( async fz =>{
  //     let {customer,status} = await getCustomerById(fz.customerId === '' || fz.customerId === undefined ? undefined : fz.customerId);
  //     if(status){
  //      return {...fz,name:customer === undefined ? '-': customer.name}
  //     }});
  //   let processTabledata = await Promise.all(freezerBoxData);
  //  await setFreezerBox(pre=>({...pre,tabledata:processTabledata}));
  //  await setFreezerBox(pre=>({...pre,spinner:false}));
  // }
  // updateData();
  // },[datas,freezerBox.modal,freezerBox.update]);
  useEffect(() => {
    async function updateData() {
      // Start spinner
      setFreezerBox((pre) => ({ ...pre, spinner: true }))

      try {
        // Get freezer box data
        const freezerBoxData = datas.freezerbox.filter((box) => !box.isDeleted)

        // Process each box and await customer data
        const processTabledata = await Promise.all(
          freezerBoxData.map(async (fz) => {
            if (fz.customerId) {
              const customer = await getCustomerById(fz.customerId)
              return { ...fz, name: customer?.name || '-' }
            } else {
              return { ...fz, name: '-' }
            }
          })
        )

        // Update state with processed data
        setFreezerBox((pre) => ({
          ...pre,
          tabledata: processTabledata.sort((a, b) => {
            const extractParts = (str) => {
              if (!str || typeof str !== 'string') return [0, '']
              const regex = /^(\d+)?(.*)$/ // Extract numeric part (if any) and remaining text
              const [, numPart, textPart] = str.match(regex) || [null, '', '']
              return [parseInt(numPart || 0, 10), textPart.trim()]
            }

            const [numA, textA] = extractParts(a.boxNumber)
            const [numB, textB] = extractParts(b.boxNumber)

            // Compare numeric parts
            const numComparison = numA - numB
            if (numComparison !== 0) return numComparison

            // Compare text parts lexicographically
            return textA.localeCompare(textB, undefined, { sensitivity: 'base' })
          })
        }))
      } catch (e) {
        console.error('Error loading freezer box data:', e)
      } finally {
        // Stop spinner
        setFreezerBox((pre) => ({ ...pre, spinner: false }))
      }
    }

    updateData()
  }, [datas, freezerBox.modal, freezerBox.update])

  const freezerboxcolumns = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, i) => {
        return i + 1
      },
      width: 80
    },
    {
      title: 'Freezer Box',
      dataIndex: 'boxNumber',
      key: 'boxNumber'
      // width: 139
    },
    {
      title: 'Customer',
      dataIndex: 'customerId',
      key: 'customerId',
      render: (text, record) => {
        return record.name
      }
    },
    {
      title: 'Action',
      render: (text, record) => {
        return (
          <div className="flex gap-x-2">
            <Typography.Link
              // disabled={freezerBox.editclick}
              onClick={async () => {
                freezerform.resetFields()
                let customer
                if (record.customerId) {
                  customer = await getCustomerById(record.customerId)
                  console.log(customer)
                }
                freezerform.setFieldsValue({
                  boxNumber: record.boxNumber,
                  customerId: customer ? customer.name : undefined
                })
                setFreezerBox((pre) => ({
                  ...pre,
                  frommodal: true,
                  editclick: true,
                  editid: record.id,
                  name: customer ? customer.name : undefined
                }))
              }}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>

            <Popconfirm
              placement="left"
              // disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              // className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={async () => {
                setFreezerBox((pre) => ({ ...pre, spinner: true }))
                await updateFreezerbox(record.id, { isDeleted: 1 })
                await message.open({ type: 'success', content: 'Deleted successfully' })
                setFreezerBox((pre) => ({ ...pre, spinner: false, update: !freezerBox.modal }))
                await freezerboxUpdateMt()
              }}
            >
              <AiOutlineDelete
                className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </div>
        )
      },
      width: 120
    }
  ]

  // const UpdateFreezerBox = async()=>{
  //   let {boxNumber,customerId} = freezerform.getFieldValue();
  //   let updateData = (customerId === freezerBox.name) ? {boxNumber:boxNumber} :{boxNumber:boxNumber,customerId:customerId === undefined ? '' : customerId};
  //   console.log(updateData);
  //   let check = datas.freezerbox.some(name => name.boxNumber.trim() === boxNumber.trim() && customerId === freezerBox.name);

  //   if(check){
  //     return message.open({type:'info',content:'No changes found'})
  //   }
  //   else{
  //   await setFreezerBox(pre =>({...pre,spinner:true}));
  //   await updateFreezerbox(freezerBox.editid,updateData);
  //   await message.open({type:'success',content:'updated successfully'});
  //   await setFreezerBox(pre =>({...pre,frommodal:false,editclick:false,editid:'',name:'',spinner:false,update:!freezerBox.modal}));
  //   await freezerboxUpdateMt();
  //   }
  // //   let checkBoxAndName = datas.freezerbox.some(name => name.boxNumber === boxNumber.trim() && name.customerId === customerId);
  // //   if(checkBoxAndName){
  // //   return message.open({type:'info',content:'No changes found'})
  // //  }
  // //  else{
  // //   console.log(customerId);
  // //   // await updateFreezerbox(freezerBox.editid,updateData);
  // //   // message.open({type:'success',content:'updated successfully'});
  // //   // setFreezerBox(pre =>({...pre,frommodal:false,editclick:false,editid:''}));
  // //   // await freezerboxUpdateMt();
  // //  }
  // };

  const UpdateFreezerBox = async () => {
    try {
      let { boxNumber, customerId } = freezerform.getFieldValue()
      boxNumber = boxNumber?.trim() || null
      customerId = customerId || null
      let updateData =
        customerId === freezerBox.name
          ? { boxNumber: boxNumber }
          : { boxNumber: boxNumber, customerId: customerId || null }

      console.log(updateData)

      if (!boxNumber) {
        return message.open({ type: 'error', content: 'Box number cannot be empty' })
      }

      let check = datas.freezerbox.some(
        (name) =>
          name.boxNumber &&
          name.boxNumber.trim() === boxNumber.trim() &&
          customerId === freezerBox.name
      )

      if (check) {
        return message.open({ type: 'info', content: 'No changes found' })
      } else {
        setFreezerBox((pre) => ({ ...pre, spinner: true }))
        await updateFreezerbox(freezerBox.editid, updateData)
        await message.open({ type: 'success', content: 'Updated successfully' })
        setFreezerBox((pre) => ({
          ...pre,
          frommodal: false,
          editclick: false,
          editid: '',
          name: '',
          spinner: false,
          update: !freezerBox.modal
        }))

        // Add try-catch to handle any errors in freezerboxUpdateMt
        await freezerboxUpdateMt()
      }
    } catch (e) {
      console.error('Error updating freezer box:', e)
      message.open({ type: 'error', content: `${e} Updated Unsuccessfully` })
    }
  }

  const [updateCustomerDetails, setUpdateCustomerDetails] = useState({ isclick: false, data: {} })

  const updateCustomerData = async () => {
    try {
      let {
        boxnumbers,
        name,
        gstin,
        address,
        mobileNumber,
        transportationType,
        vehicleOrFreezerNo
      } = form.getFieldsValue()
      boxnumbers = boxnumbers === undefined ? [] : boxnumbers
      let selectBoxConvertor = boxnumbers.some((data) => data.value === undefined)
        ? boxnumbers
        : boxnumbers.map((data) => data.value)
      let oldboxes = updateCustomerDetails.data.freezerbox.map((data) => data.id)

      //remove data
      let removedBoxes = oldboxes.filter((item) => !selectBoxConvertor.includes(item))

      //new data
      let newBoxes = selectBoxConvertor.filter((item) => !oldboxes.includes(item))

      if (
        updateCustomerDetails.data.name === name &&
        compareArrays(selectBoxConvertor, oldboxes) &&
        // await areArraysEqual(updateCustomerDetails.data.freezerbox,convertbox) &&
        updateCustomerDetails.data.gstin === gstin &&
        updateCustomerDetails.data.address === address &&
        updateCustomerDetails.data.mobileNumber === mobileNumber &&
        updateCustomerDetails.data.transportationType === transportationType &&
        updateCustomerDetails.data.vehicleOrFreezerNo === vehicleOrFreezerNo
      ) {
        return message.open({ type: 'info', content: 'No changes made' })
      } else {
        setIsNewCustomerLoading(true)
        let updateData = {
          name: name,
          gstin: gstin,
          address: address,
          mobileNumber: mobileNumber,
          transportationType: transportationType,
          vehicleOrFreezerNo: vehicleOrFreezerNo === undefined ? '' : vehicleOrFreezerNo,
          updateddate: TimestampJs()
        }

        //add new box
        if (newBoxes.length > 0) {
          newBoxes.forEach(async (id) => {
            const existingBox = await getFreezerboxById(id);
            await updateFreezerbox(id, { boxNumber: existingBox.boxNumber, customerId: updateCustomerDetails.data.id })
            await freezerboxUpdateMt()
          })
        }

        //remove box
        if (removedBoxes.length > 0) {
          removedBoxes.forEach(async (id) => {
            const existingBox = await getFreezerboxById(id);
            await updateFreezerbox(id, { boxNumber: existingBox.boxNumber, customerId: null })
            await freezerboxUpdateMt()
          })
        }

        // update customer details
        await updateCustomer(updateCustomerDetails.data.id, updateData)
        await customerUpdateMt()
        setUpdateCustomerDetails(false)
        setIsNewCustomerLoading(false)
        setIsModalOpen(false)
        message.open({ type: 'success', content: 'Update Successfully' })
      }
    } catch (e) {
      message.open({ type: 'error', content: `${e} Update Unsuccessfully` })
      console.log(e)
    }
  }

  const freezerBoxTable = TableHeight(200, 400)

  return (
    <div>
      <Modal
        zIndex={1001}
        width={300}
        centered={true}
        title={
          <span className="flex gap-x-1 justify-center items-center">
            <PiWarningCircleFill className="text-yellow-500 text-xl" /> Warning
          </span>
        }
        open={isCloseWarning}
        onOk={warningModalOk}
        onCancel={() => setIsCloseWarning(false)}
        okText="ok"
        cancelText="Cancel"
        className="center-buttons-modal"
      >
        <p className="text-center">Are your sure to Cancel</p>
      </Modal>
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
          <span className="flex gap-x-3 justify-center items-center">
            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => setFreezerBox((pre) => ({ ...pre, modal: true, spinner: true }))}
            >
              Freezer Box <BsBox2 size={13} />
            </Button>
            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0}
              onClick={exportExcel}
            >
              Export <PiExport />
            </Button>
            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                form.resetFields()
                form.setFieldsValue({ transportationType: 'Self' })
                setTransportOnchange('Self')
              }}
            >
              New Customer <IoMdAdd />
            </Button>
          </span>
        </li>

        <li className="mt-2">
          <Form form={form} component={false}>
            <Table
              virtual
              components={{
                body: {
                  cell: EditableCell
                }
              }}
              dataSource={data}
              columns={mergedColumns}
              pagination={false}
              loading={customerTbLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
            />
          </Form>
        </li>
      </ul>

      <Modal
        maskClosable={
          customerOnchange.name === '' ||
          customerOnchange.name === undefined ||
          customerOnchange.name === null
            ? true
            : false
        }
        centered={true}
        title={
          <span className="flex justify-center">
            {updateCustomerDetails.isclick ? 'UPDATE' : 'NEW'} CUSTOMER
          </span>
        }
        open={isModalOpen}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isNewCustomerLoading }}
        onCancel={() => {
          if (
            customerOnchange.name === '' ||
            customerOnchange.name === undefined ||
            customerOnchange.name === null
          ) {
            setIsModalOpen(false)
            form.resetFields()
            setCustomerOnchange({
              name: '',
              payamount: ''
            })
          } else {
            setIsCloseWarning(true)
          }
          setUpdateCustomerDetails({ isclick: false, data: [] })
        }}
      >
        <Spin spinning={isNewCustomerLoading}>
          <Form
            initialValues={{ transportationType: 'Self' }}
            onFinish={
              updateCustomerDetails.isclick === true ? updateCustomerData : createNewProject
            }
            form={form}
            layout="vertical"
            onValuesChange={(changedValues) => {
              if (changedValues.transportationType) {
                handleTransportChange(changedValues.transportationType)
              }
            }}
          >
            <Form.Item
              className="mb-2"
              name="name"
              label="Name"
              rules={[{ required: true, message: false }]}
            >
              <Input
                onChange={(e) => customerOnchangeMt(e, 'name')}
                placeholder="Enter the Customer Name"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="transportationType"
              label="Transport Type"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group
                onChange={debounce((e) => {
                  if (e.target.value === 'Company') {
                    form.resetFields(['boxnumbers'])
                  } else if (e.target.value === 'Freezer Box') {
                    form.resetFields(['vehicleOrFreezerNo'])
                  } else if (e.target.value === 'Self' || e.target.value === 'Mini Box') {
                    form.resetFields(['boxnumbers', 'vehicleOrFreezerNo'])
                  }
                  setTransportOnchange(e.target.value)
                }, 300)}
              >
                <Radio value={'Self'}>Self</Radio>
                <Radio value={'Company'}>Company</Radio>
                <Radio value={'Freezer Box'}>Freezer Box</Radio>
                <Radio value={'Mini Box'}>Mini Box</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="vehicleOrFreezerNo"
              label="Vehicle Number "
              rules={[{ required: false, message: false }]}
            >
              <Input
                className="w-full"
                // disabled={isVehicleNoDisabled}
                disabled={transportOnchange === 'Company' ? false : true}
                placeholder="Enter the Vehicle Number"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="boxnumbers"
              label="Freezer Number"
              rules={[{ required: false, message: false }]}
            >
              <Select
                mode="multiple"
                allowClear
                className="w-full"
                // disabled={isVehicleNoDisabled}
                disabled={transportOnchange === 'Freezer Box' ? false : true}
                placeholder="Select the Box Number"
                options={datas.freezerbox
                  .filter((f) => !f.customerId)
                  .map((box) => ({ label: box.boxNumber, value: box.id }))}
              />
            </Form.Item>

            <Form.Item
              className="mb-2 w-full"
              name="mobileNumber"
              label="Mobile Number"
              rules={[
                { required: true, message: false },
                { type: 'number', message: false }
              ]}
            >
              <InputNumber className="w-full" type="number" placeholder="Enter the Mobile Number" />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="gstin"
              label="GSTIN"
              rules={[{ required: false, message: false }]}
            >
              <Input placeholder="Enter the GST Number" />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="address"
              label="Address"
              rules={[{ required: true, message: false }]}
            >
              <TextArea rows={2} placeholder="Enter the Address" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        centered={true}
        maskClosable={
          customerOnchange.payamount === '' ||
          customerOnchange.payamount === undefined ||
          customerOnchange.payamount === null
            ? true
            : false
        }
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h1 className="text-xl font-bold">{customerName}</h1>{' '}
          </div>
        }
        open={isPayModelOpen}
        onCancel={() => {
          if (
            customerOnchange.payamount === '' ||
            customerOnchange.payamount === undefined ||
            customerOnchange.payamount === null
          ) {
            setIsPayModelOpen(false)
          } else {
            setIsCloseWarning(true)
          }
        }}
        onOk={() => payForm.submit()}
        okButtonProps={{ disabled: isCustomerPayLoading }}
      >
        <Spin spinning={isCustomerPayLoading}>
          <Form
            onFinish={customerPay}
            form={payForm}
            initialValues={{ date: dayjs(), paymentMode: 'Cash', type: 'Payment' }}
            layout="vertical"
          >
            <Form.Item name="type" className="mb-1 mt-3">
              <Radio.Group
                buttonStyle="solid"
                style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
              >
                <Radio.Button value="Advance" style={{ width: '33%' }}>
                  ADVANCE
                </Radio.Button>
                <Radio.Button value="Payment" style={{ width: '34%' }}>
                  PAYMENT
                </Radio.Button>
                <Radio.Button value="Spend" style={{ width: '33%' }}>
                  SPEND
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              className="mb-1"
              name="amount"
              label="Amount"
              rules={[{ required: true, message: false }]}
            >
              <InputNumber
                onChange={(e) => customerOnchangeMt(e, 'payamount')}
                min={0}
                type="number"
                className="w-full"
                placeholder="Enter the Amount"
              />
            </Form.Item>
            <Form.Item className="mb-1" name="description" label="Description">
              <TextArea rows={4} placeholder="Write the Description" />
            </Form.Item>
            <Form.Item
              className=" absolute top-[-3rem]"
              name="date"
              label=""
              rules={[{ required: true, message: false }]}
            >
              <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
            </Form.Item>

            <Form.Item
              className="mb-0"
              name="paymentMode"
              label="Payment Mode"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group size="small">
                <Radio value="Cash">Cash</Radio>
                <Radio value="Card">Card</Radio>
                <Radio value="UPI">UPI</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={
          <div className="flex items-center justify-start">
            <Search
              placeholder="Search..."
              allowClear
              className="w-[20%]"
              onChange={onPayDetailsSearchChange}
              onSearch={handlePayDetailsSearch}
              enterButton
              style={{ height: '32px' }}
              value={tempSearchText}
            />
            <span className="text-center w-full block pb-1">
              PAY DETAILS <Tag color="blue">{customerName}</Tag>
            </span>
          </div>
        }
        open={isPayDetailsModelOpen}
        footer={null}
        width={1000}
        onCancel={() => {
          setIsPayDetailsModelOpen(false)
          setSearchTextModal('')
          setTempSearchText('')
        }}
      >
        <Table
          virtual
          pagination={false}
          columns={payDetailsColumns}
          dataSource={payDetailsData.filter((item) => {
            const date = item.date ? item.date.toString() : ''
            const total = item.total ? item.total.toString() : ''
            const billAmount = item.billamount ? item.billamount.toString() : item.amount.toString()
            const paymentMode = item.paymentMode ? item.paymentMode.toString() : ''
            const boxNumber = item.boxNumber ? item.boxNumber.toString() : ''
            const paymentStatus = item.paymentstatus ? item.paymentstatus.toString() : ''
            const partialAmount = item.partialamount ? item.partialamount.toString() : ''
            const type = item.type ? item.type.toString() : ''
            const description = item.description ? item.description.toString() : ''
            const searchValue = searchTextModal.toLowerCase()
            return (
              date.toLowerCase().includes(searchValue) ||
              total.toLowerCase().includes(searchValue) ||
              billAmount.toLowerCase().includes(searchValue) ||
              paymentMode.toLowerCase().includes(searchValue) ||
              boxNumber.toLowerCase().includes(searchValue) ||
              paymentStatus.toLowerCase().includes(searchValue) ||
              partialAmount.toLowerCase().includes(searchValue) ||
              description.toLowerCase().includes(searchValue) ||
              type.toLowerCase().includes(searchValue)
            )
          })}
          rowKey="id"
          scroll={{ y: historyHeight }}
        />
        <div className="flex justify-between mt-2 font-semibold">
          <div>Order: {totalPurchaseAmount.toFixed(2)}</div>
          <div>Return: {totalReturnAmount.toFixed(2)}</div>
          <div>Payment: {totalPaymentAmount.toFixed(2)}</div>
          <div>Balance: {totalBalanceAmount.toFixed(2)}</div>
        </div>
      </Modal>

      <Modal
        centered={true}
        title={
          <span className="text-center block">
            {freezerBox.editclick === true ? 'UPDATE' : 'NEW'} FREEZERBOX
          </span>
        }
        open={freezerBox.frommodal}
        onCancel={() => setFreezerBox((pre) => ({ ...pre, frommodal: false, editclick: false }))}
        onOk={() => freezerform.submit()}
        okButtonProps={{ disabled: freezerBox.spinner }}
      >
        <Spin spinning={freezerBox.spinner}>
          <Form
            // initialValues={{ transportationType: 'Self' }}
            onFinish={freezerBox.editclick === true ? UpdateFreezerBox : CreateNewFreezerBox}
            // onFinish={updateCustomerDetails === true ? updateCustomer : CreateNewFreezerBox}
            form={freezerform}
            layout="vertical"
          >
            <Form.Item
              className="mb-2"
              name="boxNumber"
              label="Box Number"
              rules={[{ required: true, message: false }]}
            >
              <Input
                // disabled={freezerBox.editclick}
                // onChange={(e) => setFreezerBox(pre =>({...pre,onchangevalue:e}))}
                placeholder="box number"
              />
            </Form.Item>

            {freezerBox.editclick === true ? (
              <Form.Item name="customerId">
                <Select
                  allowClear
                  showSearch
                  // size={size}
                  placeholder="Please select"
                  // onChange={handleChange}
                  style={{
                    width: '100%'
                  }}
                  options={datas.customers
                    .filter((cs) => cs.transportationType === 'Freezer Box')
                    .map((item) => ({ label: item.name, value: item.id }))}
                />
              </Form.Item>
            ) : (
              ''
            )}
          </Form>
        </Spin>
      </Modal>

      <Modal
        title={
          <div className="relative block text-center">
            <span>FREEZER BOX</span>
            <Button
              className="absolute right-7 -top-1"
              onClick={() => {
                setFreezerBox((pre) => ({ ...pre, frommodal: true }))
                freezerform.resetFields()
              }}
              type="primary"
            >
              Add
            </Button>
          </div>
        }
        footer={<></>}
        centered={true}
        width={800}
        open={freezerBox.modal}
        onCancel={() => setFreezerBox((pre) => ({ ...pre, modal: false }))}
      >
        <Spin spinning={freezerBox.spinner}>
          {/* <span>Hi</span> */}
          <Form className="scrollable-container">
            <Table
              // truncateString
              pagination={false}
              dataSource={freezerBox.tabledata}
              className="mt-4 freezerbox-table"
              columns={freezerboxcolumns}
              scroll={{ x: false, y: 400 }}
              // virtual
            />
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}
