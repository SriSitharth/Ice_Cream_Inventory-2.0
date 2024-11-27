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
import { MdOutlineModeEditOutline, MdProductionQuantityLimits } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import {
  createCustomer,
  updateCustomer,
  getCustomerPayDetailsById,
  updatePaydetailsCustomer,
  getCustomerById
} from '../firebase/data-tables/customer'
import { addDoc, collection, doc, getDocs } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import dayjs from 'dayjs'
import { formatToRupee } from '../js-files/formate-to-rupee'
const { Search, TextArea } = Input
import { PiWarningCircleFill } from 'react-icons/pi'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { truncateString } from '../js-files/letter-length-sorting'
import { BsBox2 } from "react-icons/bs";
import { createFreezerbox, getFreezerboxById, updateFreezerbox } from '../firebase/data-tables/freezerbox'
import { IoCloseCircle } from 'react-icons/io5'
import { BsBoxSeam } from "react-icons/bs";
import { areArraysEqual, compareArrays } from '../js-files/compare-two-array-of-object'
import './css/CustomerList.css';
import TableHeight from '../components/TableHeight'

export default function CustomerList({ datas, customerUpdateMt, freezerboxUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [freezerform] = Form.useForm();
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
  const [transportOnchange,setTransportOnchange] = useState('Self')

  // side effect
  useEffect(() => {
    setCustomerTbLoading(true)
    const filteredData = datas.customers
      .filter((data) => data.isdeleted === false)
      .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    

    let compainData = filteredData.map(customer => {
      let getvalue = datas.freezerbox.filter(fz => customer.id === fz.customerid && fz.isdeleted === false).map(data=>({boxnumber: data.boxnumber,id:data.id}));
      return {...customer,freezerbox:getvalue}
    });
    setData(compainData);
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

  const [searchTextModal, setSearchTextModal] = useState('');
  const [tempSearchText, setTempSearchText] = useState('');

  const onPayDetailsSearchChange = (e) => {
    setTempSearchText(e.target.value);
    if (e.target.value === '') {
      setSearchTextModal('')
    }
  }
  const handlePayDetailsSearch = (value) => {
    console.log(payDetailsData)
    setSearchTextModal(value.trim());
  }

  const [isNewCustomerLoading, setIsNewCustomerLoading] = useState(false)
  // create new project
  const createNewProject = async (values) => {

    let {boxnumbers,...newvalue} = values;
    boxnumbers = boxnumbers === undefined ? [] : boxnumbers
    setIsNewCustomerLoading(true)
    try {
     let result =  await createCustomer({
        ...newvalue,
        gstin: values.gstin || '',
        vehicleorfreezerno: values.vehicleorfreezerno || '',
        createddate: TimestampJs(),
        updateddate: '',
        isdeleted: false
      });

      let customerid = result.status ===200 ? result.res.id : undefined;

      if(boxnumbers.length > 0 && boxnumbers){
      boxnumbers.forEach(async box => {
        await updateFreezerbox(box,{
        customerid:customerid,
        updateddate:TimestampJs(),
        });
        await freezerboxUpdateMt()
      })}else{
        console.log('No');
        
      };

      await customerUpdateMt();

      message.open({ type: 'success', content: 'Customer Added Successfully' })
    } catch (e) {
      console.log(e);
      message.open({ type: 'error', content: `${e} Customer Added Unsuccessfully` })
    } finally {
      form.resetFields()
      setIsModalOpen(false)
      setIsNewCustomerLoading(false)
      setCustomerOnchange({
        customername: '',
        payamount: ''
      })
    }
    
  };

  const showPayModal = (record) => {
    setCustomerName(record.customername)
    payForm.resetFields()
    setCustomerPayId(record.id)
    setIsPayModelOpen(true)
  };

  const [isCustomerPayLoading, setIsCustomerPayLoading] = useState(false)
  
  const customerPay = async (value) => {
    setIsCustomerPayLoading(true)
    let { date, description, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const payData = {
      ...Datas,
      collectiontype:'customer',
      date: formateDate,
      customerid:customerPayId,
      description: description || '',
      createddate: TimestampJs(),
      isdeleted:false,
    }
    try {
      const customerDocRef = doc(db, 'customer', customerPayId)
      const payDetailsRef = collection(customerDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
      message.open({ type: 'success', content: 'Pay Added Successfully' })
    } catch (e) {
      console.log(e)
    } finally {
      payForm.resetFields()
      setCustomerPayId(null)
      setIsPayModelOpen(false)
      setIsCustomerPayLoading(false)
      setCustomerOnchange({
        customername: '',
        payamount: ''
      })
    }
  }

  const [customerName,setCustomerName] = useState('');
  
  const showPayDetailsModal = async (record) => {
    setCustomerName(record.customername)
    try {
      const payDetailsResponse = await getCustomerPayDetailsById(record.id);

      let payDetails = []
      if (payDetailsResponse.status === 200) {
        payDetails = payDetailsResponse.paydetails.filter(data => data.isdeleted === false)
      }
      const deliveryDocRef = await datas.delivery.filter(
        (item) => item.isdeleted === false && item.customerid === record.id
      ).map(data=>({...data,customername:record.customername}))

      const combinedData = payDetails.concat(deliveryDocRef)
      let sortedData = await latestFirstSort(combinedData)
      
      // setPayDetailsData(sortedData)

      const addFreezerboxNumber = await Promise.all(
        sortedData.map(async data => {
          const { freezerbox, status } = await getFreezerboxById(data.boxid);
          return { ...data, boxnumber: freezerbox ? freezerbox.boxnumber : ''};
        })
      );

      setPayDetailsData(addFreezerboxNumber)
      
      

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
          } else if (item.paymentstatus === 'Partial'){
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
            return formatToRupee(record.amount, true);
          } 
        }else {
          return formatToRupee(record.billamount, true);
        }
        return null;
      },
      width: 120
    },
    {
      title: 'Spend',
      dataIndex: 'amount',
      key: 'spend',
      render: (_, record) => {
        if (record.amount !== undefined && record.type === 'Spend') {
            return formatToRupee(record.amount, true);
        }
        return null;
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
            return formatToRupee(record.amount, true);
          }
        }
      },
      width: 100
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render:  (_, record) => {
        
        return record.type === undefined ? (
          <Tag color="green">Pay</Tag>
        ) : record.type === 'order' ? (
          <span className='flex'><Tag color="green">Order</Tag> <Tag className={`${record.boxnumber === '' ? 'hidden': 'inline-block'}`}>{record.boxnumber}</Tag> </span>
        ) : record.type === 'return' ? (
           <span className='flex'><Tag color="red">Return</Tag><Tag className={`${record.boxnumber === '' ? 'hidden': 'inline-block'}`}>{record.boxnumber}</Tag></span>
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
            {record.type === 'Balance' ? <Tag color='orange'>Book</Tag> : <Tag color="cyan">{record.paymentmode}</Tag>}
          </>
        ) : record.paymentstatus === 'Paid' ? (
          <span className="flex items-center">
            <Tag color="green">Paid</Tag>
            {record.paymentmode && <Tag color="cyan">{record.paymentmode}</Tag>}
          </span>
        ) : record.paymentstatus === 'Unpaid' ? (
          <Tag color="red">UnPaid</Tag>
        ) : record.paymentstatus === 'Partial' ? (
          <span className="flex  items-center">
            <Tag color="yellow">Partial</Tag>{' '}
            <Tag color="blue" className="text-[0.7rem]">
              {formatToRupee(record.partialamount, true)}
            </Tag>
            {record.paymentmode && <Tag color="cyan">{record.paymentmode}</Tag>}
          </span>
        ) :  (
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
          String(record.customername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.transport).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.gstin).toLowerCase().includes(value.toLowerCase()) ||
          String(record.vehicleorfreezerno).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername',
      editable: true,
      sorter: (a, b) => a.customername.localeCompare(b.customername),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Transport',
      dataIndex: 'transport',
      key: 'transport',
      editable: true,
      sorter: (a, b) => a.transport.localeCompare(b.transport),
      showSorterTooltip: { target: 'sorter-icon' },
      width: 139
    },
    {
      title: 'Mobile',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: true,
      width: 136
    },
    {
      title: 'GSTIN ',
      dataIndex: 'gstin',
      key: 'gstin',
      width: 140,
      editable: true,
      render: (text,record)=>{
        return text.length > 10 ? <Tooltip title={text}>{truncateString(text,10)}</Tooltip> : text
      }
    },
    {
      title: 'Address',
      dataIndex: 'location',
      key: 'location',
      editable: true,
      sorter: (a, b) => a.location.localeCompare(b.location),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text,record)=>{
        return text.length > 10 ? <Tooltip title={text}>{truncateString(text,10)}</Tooltip> : text
      }
    },
    // {
    //   title: 'Vehicle',
    //   dataIndex: 'vehicleorfreezerno',
    //   key: 'vehicleorfreezerno',
    //   editable: true,
    //   sorter: (a, b) => a.location.localeCompare(b.location),
    //   showSorterTooltip: { target: 'sorter-icon' },
    //   render: (text,record)=>{
    //     return text.length > 10 ? <Tooltip title={text}>{truncateString(text,10)}</Tooltip> : text
    //   }
    // },
    {
      title: 'Number',
      // title: 'Freezer Box',
      dataIndex: 'vehicleorfreezerno',
      key: 'vehicleorfreezerno',
      width:120,
      // editable: true,
      render: (text,record)=>{
        
        let freezerboxCount = record.freezerbox.length;
        // return text.length > 12 ? <Tooltip title={text}>{truncateString(text,12)}</Tooltip> : text
        return ( <>

        {
          record.transport === 'Company' ? <Tooltip title={record.vehicleorfreezerno}>{truncateString(record.vehicleorfreezerno,10)}</Tooltip> 
          : record.transport === 'Freezer Box' ?
          <Badge size='small' count={freezerboxCount}>
          <Button onClick={() => setFreezerBox(pre=>({...pre,popupid:record.id}))} className="h-[1.7rem]">
          <BsBoxSeam/>
          </Button>
          <Popover
            content={<div>
            {
              freezerboxCount === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : record.freezerbox.map((data,i)=>{
              return <span>{i+1}.{data.boxnumber}<br/> </span>
            })
           }
              <IoCloseCircle onClick={()=> setFreezerBox(pre=>({...pre,popupid:null}))} color='red' size={20} className='absolute right-2 top-2 cursor-pointer'/>
            </div>}
            title="Freezer Box"
            trigger="click"
            open={freezerBox.popupid === record.id} // Open only for the clicked row
            onOpenChange={(visible) => {
              if (visible){
                setFreezerBox(pre=>({...pre,popupid:record.id}))
              }else{
                setFreezerBox(pre=>({...pre,popupid:null}))
              }
            }}
          >
          </Popover>
      </Badge>
      : '-'
        }
        
        </> )
        
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
              onClick={()=>{
                setUpdateCustomerDetails({isclick:true,data:record});
                setIsModalOpen(true);
                form.setFieldsValue({
                  customername:record.customername,
                  transport:record.transport,
                  vehicleorfreezerno:record.vehicleorfreezerno,
                  boxnumbers:record.freezerbox.map(data=>({label:data.boxnumber,value:data.id})),
                  mobilenumber:record.mobilenumber,
                  gstin:record.gstin,
                  location:record.location
                  });
                  setTransportOnchange(record.transport)
                console.log(
                  record.freezerbox,
                )
              }}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
            <Popconfirm
            placement='left'
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
    const inputNode = dataIndex === 'mobilenumber' ? <InputNumber type="number" /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'transport' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="transport"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select transport"
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
            ) : dataIndex === 'mobilenumber' ? (
              <Form.Item
                name="mobilenumber"
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
                      dataIndex === 'customername' ||
                      dataIndex === 'transport' ||
                      dataIndex === 'mobilenumber' ||
                      dataIndex === 'location'
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
        inputType: col.dataIndex === 'mobilenumber' ? 'number' : 'text',
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
        row.customername === key.customername &&
        row.transport === key.transport &&
        row.location === key.location &&
        row.vehicleorfreezerno === key.vehicleorfreezerno &&
        row.mobilenumber === key.mobilenumber &&
        row.gstin === key.gstin
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateCustomer(key.id, { ...row, updateddate: TimestampJs() })
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
    const { id, ...newData } = data;

    let {paydetails,status} = await getCustomerPayDetailsById(data.id);

    if(paydetails.length > 0){
      paydetails.map( async paydata =>{
         await updatePaydetailsCustomer(id,paydata.id,{isdeleted:true});
      });
    };
    
    await updateCustomer(id, {
      isdeleted: true,
      // deletedby: 'admin',
      deleteddate: TimestampJs()
    });

    // remove freezerbox customerid:''
      if(newData.freezerbox.length > 0){
        let boxIds = await datas.freezerbox.filter(fz => newData.freezerbox.some(box => box.boxnumber === fz.boxnumber)).map(box=> ({id:box.id}));
        boxIds.forEach(async box=>{
          await updateFreezerbox(box.id,{customerid:'',updateddate:TimestampJs()});
          await freezerboxUpdateMt();
        });
      }
    await customerUpdateMt();
    message.open({ type: 'success', content: 'Deleted Successfully' });
  }

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const excelDatas = exportDatas.map((pr, i) => ({
      No: i + 1,
      Customer: pr.customername,
      Mobile: pr.mobilenumber,
      GSTIN: pr.gstin || '',
      Location: pr.location,
      Transport: pr.transport,
      Vehicle: pr.vehicleorfreezerno || ''
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
    customername: '',
    payamount: ''
  })

  const warningModalOk = () => {
    setIsModalOpen(false)
    form.resetFields()
    setIsCloseWarning(false)
    setCustomerOnchange({
      customername: '',
      payamount: ''
    })
    setIsPayModelOpen(false)
  }

  const customerOnchangeMt = debounce((e, input) => {
    if (input === 'customername') {
      setCustomerOnchange({
        customername: e.target.value,
        payamount: ''
      })
    } else {
      setCustomerOnchange({
        customername: '',
        payamount: e
      })
    }
  }, 200);


  const [freezerBox,setFreezerBox] = useState({
    modal:false,
    frommodal:false,
    onchangevalue:'',
    editclick:false,
    freezername:'',
    editid:'',
    spinner:false,
    tabledata:[],
    customername:'',
    update:false,
    popupid:null
  });


  // create freezer box
  const CreateNewFreezerBox = async()=>{
  try{
    let checkExsistingBox = datas.freezerbox.some(box => box.boxnumber.trim() === freezerform.getFieldsValue().boxnumber.trim());
  if(checkExsistingBox){
  return message.open({type:'warning',content:'The box name is already exsist'});
  }
  else{
    setFreezerBox(pre=>({...pre,spinner:true}))
  let newFreezerData = { ...freezerform.getFieldsValue(),
                          isdeleted:false,
                          customerid:'',
                          createddate:TimestampJs(),
                          };
    await createFreezerbox(newFreezerData);
    message.open({type:'success',content:'create freezerbox successfully'});
    await freezerboxUpdateMt();
    setFreezerBox(pre =>({...pre,frommodal:false})); 
    setFreezerBox(pre=>({...pre,spinner:false})) 
  }
  }catch(e){
    console.log(e);
    message.open({type:'error',content:`${e} create freezerbox successfully`});
  }
};


  // useEffect(()=>{
  // async function updateData(){
  //  await setFreezerBox(pre=>({...pre,spinner:true}));
  //   let freezerBoxData = await datas.freezerbox.filter(box => box.isdeleted === false).map( async fz =>{
  //     let {customer,status} = await getCustomerById(fz.customerid === '' || fz.customerid === undefined ? undefined : fz.customerid);
  //     if(status){
  //      return {...fz,customername:customer === undefined ? '-': customer.customername}
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
      setFreezerBox(pre => ({ ...pre, spinner: true }));
  
      try {
        // Get freezer box data
        const freezerBoxData = datas.freezerbox.filter(box => !box.isdeleted);
  
        // Process each box and await customer data
        const processTabledata = await Promise.all(
          freezerBoxData.map(async fz => {
            const { customer, status } = await getCustomerById(fz.customerid || undefined);
            if (status) {
              return { ...fz, customername: customer ? customer.customername : '-' };
            }
            return fz; // Handle cases where status is false
          })
        );
  
        // Update state with processed data
        setFreezerBox(pre => ({ ...pre, tabledata: processTabledata.sort((a, b) => {
          const extractParts = (str) => {
            const regex = /^(\d+)?(.*)$/; // Extract numeric part (if any) and remaining text
            const [, numPart, textPart] = str.match(regex) || [null, '', ''];
            return [parseInt(numPart || 0, 10), textPart.trim()];
          };
      
          const [numA, textA] = extractParts(a.boxnumber);
          const [numB, textB] = extractParts(b.boxnumber);
      
          // Compare numeric parts
          const numComparison = numA - numB;
          if (numComparison !== 0) return numComparison;
      
          // Compare text parts lexicographically
          return textA.localeCompare(textB, undefined, { sensitivity: 'base' });
        }),
         }));
      } catch (e) {
        console.error('Error loading freezer box data:', e);
      } finally {
        // Stop spinner
        setFreezerBox(pre => ({ ...pre, spinner: false }));
      }
    }
  
    updateData();
  }, [datas, freezerBox.modal, freezerBox.update]);
  


  const freezerboxcolumns = [
    {
      title: 'S.No',
      key: 'sno',
      render:(text,recorde,i)=>{
        return i + 1
      },
      width: 80,
    },
    {
      title: 'Freezer Box',
      dataIndex: 'boxnumber',
      key: 'boxnumber',
      // width: 139
    },
    {
      title: 'Customer',
      dataIndex: 'customerid',
      key: 'customerid',
      render:  (text,record)=>{
        return record.customername
      }
    },
    {
      title: 'Action',
      render: (text,record)=>{
        return <div className='flex gap-x-2'>
           <Typography.Link
              // disabled={freezerBox.editclick}
              onClick={ async()=> {
                freezerform.resetFields();
                // let customerFilter = datas.customers.find(cs => cs.id === record.customerid)
                // let customerFilter = datas.customers.find(cs => cs.id === record.customerid);
                let {customer,status} = await getCustomerById(record.customerid);
                freezerform.setFieldsValue({boxnumber:record.boxnumber,customerid:customer === undefined ? undefined : customer.customername});
                setFreezerBox(pre =>({...pre,frommodal:true,editclick:true,editid:record.id,customername:customer === undefined ? undefined : customer.customername}));  
              }}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>

            <Popconfirm
              placement='left'
              // disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              // className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={async () => {
                setFreezerBox(pre =>({...pre,spinner:true}));
                await updateFreezerbox(record.id,{isdeleted:true,updateddate:TimestampJs()});
                await message.open({type:'success',content:'Deleted successfully'});
                setFreezerBox(pre =>({...pre,spinner:false,update:!freezerBox.modal}));
                await freezerboxUpdateMt();
                }}>
              <AiOutlineDelete
                className={`${editingKeys.length !== 0 || selectedRowKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}/>
            </Popconfirm>
        </div>
      },
      width:120
    }
  ];

  // const UpdateFreezerBox = async()=>{
  //   let {boxnumber,customerid} = freezerform.getFieldValue();
  //   let updateData = (customerid === freezerBox.customername) ? {boxnumber:boxnumber} :{boxnumber:boxnumber,customerid:customerid === undefined ? '' : customerid};
  //   console.log(updateData);
  //   let check = datas.freezerbox.some(name => name.boxnumber.trim() === boxnumber.trim() && customerid === freezerBox.customername);
    
  //   if(check){
  //     return message.open({type:'info',content:'No changes found'})
  //   }
  //   else{
  //   await setFreezerBox(pre =>({...pre,spinner:true}));   
  //   await updateFreezerbox(freezerBox.editid,updateData);
  //   await message.open({type:'success',content:'updated successfully'});
  //   await setFreezerBox(pre =>({...pre,frommodal:false,editclick:false,editid:'',customername:'',spinner:false,update:!freezerBox.modal})); 
  //   await freezerboxUpdateMt();
  //   }
  // //   let checkBoxAndName = datas.freezerbox.some(name => name.boxnumber === boxnumber.trim() && name.customerid === customerid);
  // //   if(checkBoxAndName){
  // //   return message.open({type:'info',content:'No changes found'})
  // //  }
  // //  else{
  // //   console.log(customerid);
  // //   // await updateFreezerbox(freezerBox.editid,updateData);
  // //   // message.open({type:'success',content:'updated successfully'});
  // //   // setFreezerBox(pre =>({...pre,frommodal:false,editclick:false,editid:''})); 
  // //   // await freezerboxUpdateMt();
  // //  }
  // };

  const UpdateFreezerBox = async () => {
    try {
      let { boxnumber, customerid } = freezerform.getFieldValue();
      let updateData =
        customerid === freezerBox.customername
          ? { boxnumber: boxnumber }
          : { boxnumber: boxnumber, customerid: customerid === undefined ? '' : customerid };
  
      console.log(updateData);
  
      let check = datas.freezerbox.some(
        (name) => name.boxnumber.trim() === boxnumber.trim() && customerid === freezerBox.customername
      );
  
      if (check) {
        return message.open({ type: 'info', content: 'No changes found' });
      } else {
        setFreezerBox((pre) => ({ ...pre, spinner: true }));
        await updateFreezerbox(freezerBox.editid, updateData);
        await message.open({ type: 'success', content: 'Updated successfully' });
        setFreezerBox((pre) => ({
          ...pre,
          frommodal: false,
          editclick: false,
          editid: '',
          customername: '',
          spinner: false,
          update: !freezerBox.modal,
        }));
  
        // Add try-catch to handle any errors in freezerboxUpdateMt
        await freezerboxUpdateMt();
      }
    } catch (e) {
      console.error('Error updating freezer box:', e);
      message.open({ type: 'error', content: `${e} Updated Unsuccessfully` });
    }
  };
  

  const [updateCustomerDetails,setUpdateCustomerDetails] = useState({isclick:false,data:{}});
  
  const updateCustomerData = async ()=>{
    try{
      let {boxnumbers,customername,gstin,location,mobilenumber,transport,vehicleorfreezerno} = form.getFieldsValue();
    boxnumbers = boxnumbers === undefined ? [] : boxnumbers
    let selectBoxConvertor = boxnumbers.some(data => data.value === undefined) ? boxnumbers :  boxnumbers.map(data => data.value);
    let oldboxes = updateCustomerDetails.data.freezerbox.map(data => data.id);

    //remove data
    let removedBoxes = oldboxes.filter(item => !selectBoxConvertor.includes(item));

    //new data
    let newBoxes = selectBoxConvertor.filter(item => !oldboxes.includes(item));
    
    if(updateCustomerDetails.data.customername === customername &&
      compareArrays(selectBoxConvertor,oldboxes) &&
      // await areArraysEqual(updateCustomerDetails.data.freezerbox,convertbox) &&
      updateCustomerDetails.data.gstin === gstin &&
      updateCustomerDetails.data.location === location &&
      updateCustomerDetails.data.mobilenumber === mobilenumber &&
      updateCustomerDetails.data.transport === transport && 
      updateCustomerDetails.data.vehicleorfreezerno === vehicleorfreezerno
    ){
      return message.open({type:'info',content:'No changes made'})
    }
    else{
      setIsNewCustomerLoading(true)
      let updateData = {
        customername:customername,
        gstin:gstin,
        location:location,
        mobilenumber:mobilenumber,
        transport:transport,
        vehicleorfreezerno:vehicleorfreezerno === undefined ? '' : vehicleorfreezerno,
        updateddate:TimestampJs()
      }

      //add new box
      if(newBoxes.length > 0){
        newBoxes.forEach(async id =>{
         await updateFreezerbox(id,{customerid:updateCustomerDetails.data.id,updateddate:TimestampJs()});
         await freezerboxUpdateMt();
        });
      };

      //remove box
      if(removedBoxes.length > 0){
        removedBoxes.forEach(async id =>{
          await updateFreezerbox(id,{customerid:'',updateddate:TimestampJs()});
          await freezerboxUpdateMt();
        });
      };
      
      // update customer details
      await updateCustomer(updateCustomerDetails.data.id,updateData);
      await customerUpdateMt();
      setUpdateCustomerDetails(false);
      setIsNewCustomerLoading(false);
      setIsModalOpen(false)
      message.open({type:'success',content:'Update Successfully'})
    }}
    catch(e){
      message.open({type:'error',content:`${e} Update Unsuccessfully`})
      console.log(e);
    }
  };

  const freezerBoxTable = TableHeight(200,400);

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
          <Button disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
          onClick={()=> setFreezerBox(pre=>({...pre,modal:true,spinner:true}))}>
              Freezer Box <BsBox2 size={13}/></Button>
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
                form.setFieldsValue({ transport: 'Self' });
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
          customerOnchange.customername === '' ||
          customerOnchange.customername === undefined ||
          customerOnchange.customername === null
            ? true
            : false
        }
        centered={true}
        title={<span className="flex justify-center">{updateCustomerDetails.isclick ? 'UPDATE' : 'NEW' }  CUSTOMER</span>}
        open={isModalOpen}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isNewCustomerLoading }}
        onCancel={() => {
          if (
            customerOnchange.customername === '' ||
            customerOnchange.customername === undefined ||
            customerOnchange.customername === null
          ) {
            setIsModalOpen(false)
            form.resetFields()
            setCustomerOnchange({
              customername: '',
              payamount: ''
            })
          } else {
            setIsCloseWarning(true)
          }
          setUpdateCustomerDetails({isclick:false,data:[]});
        }}
      >
        <Spin spinning={isNewCustomerLoading}>
          <Form
            initialValues={{ transport: 'Self' }}
            onFinish={updateCustomerDetails.isclick === true ? updateCustomerData : createNewProject}
            form={form}
            layout="vertical"
            onValuesChange={(changedValues) => {
              if (changedValues.transport) {
                handleTransportChange(changedValues.transport)
              }
            }}
          >
            <Form.Item
              className="mb-2"
              name="customername"
              label="Name"
              rules={[{ required: true, message: false }]}
            >
              <Input
                onChange={(e) => customerOnchangeMt(e, 'customername')}
                placeholder="Enter the Customer Name"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="transport"
              label="Transport Type"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group onChange={debounce((e)=>{
                if(e.target.value === 'Company'){
                  form.resetFields(['boxnumbers'])
                }
                else if(e.target.value === 'Freezer Box'){
                  form.resetFields(['vehicleorfreezerno'])
                }
                else if(e.target.value === 'Self' || e.target.value === 'Mini Box'){
                  form.resetFields(['boxnumbers','vehicleorfreezerno'])
                }
                setTransportOnchange(e.target.value);
                },300)}>
                <Radio value={'Self'}>Self</Radio>
                <Radio value={'Company'}>Company</Radio>
                <Radio value={'Freezer Box'}>Freezer Box</Radio>
                <Radio value={'Mini Box'}>Mini Box</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="vehicleorfreezerno"
              label="Vehicle Number "
              rules={[{ required: false, message: false }]}
            >
              <Input
                className="w-full"
                // disabled={isVehicleNoDisabled}
                disabled={transportOnchange === 'Company' ? false :true }
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
              options={datas.freezerbox.filter(f => f.isdeleted === false && (f.customerid === '' || f.customerid === undefined)).map(box=>({label:box.boxnumber,value:box.id}))}
              />
            </Form.Item>

            <Form.Item
              className="mb-2 w-full"
              name="mobilenumber"
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
              name="location"
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
            <h1 className='text-xl font-bold'>{customerName}</h1>{' '}
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
            onFinish={ customerPay}
            form={payForm}
            initialValues={{ date: dayjs(), paymentmode: 'Cash', type: 'Payment' }}
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
              name="paymentmode"
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
        title={<div className="flex items-center justify-start"> 
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
          <span className="text-center w-full block pb-1">PAY DETAILS <Tag color='blue'>{customerName}</Tag></span>
        </div>}
        open={isPayDetailsModelOpen}
        footer={null}
        width={1000}
        onCancel={() => {
          setIsPayDetailsModelOpen(false)
          setSearchTextModal('');
          setTempSearchText('');
        }}
      >
        <Table
          virtual
          pagination={false}
          columns={payDetailsColumns}
          dataSource={payDetailsData.filter(item => {
            const date = item.date ? item.date.toString() : ''; 
            const total = item.total ? item.total.toString() : ''; 
            const billAmount = item.billamount ? item.billamount.toString() : item.amount.toString();
            const paymentMode = item.paymentmode ? item.paymentmode.toString() : '';
            const boxNumber = item.boxnumber ? item.boxnumber.toString() : '';
            const paymentStatus = item.paymentstatus ? item.paymentstatus.toString() : '';
            const partialAmount = item.partialamount ? item.partialamount.toString() : '';
            const type = item.type ? item.type.toString() : '';
            const description = item.description ? item.description.toString() : '';
            const searchValue = searchTextModal.toLowerCase();
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
            );
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
      title={<span className='text-center block'>{freezerBox.editclick === true ? "UPDATE" : "NEW"} FREEZERBOX</span>} open={freezerBox.frommodal} 
      onCancel={()=>setFreezerBox(pre =>({...pre,frommodal:false,editclick:false}))}
      onOk={()=> freezerform.submit()}
      okButtonProps={{disabled:freezerBox.spinner}}>
       <Spin spinning={freezerBox.spinner}>
      <Form
            // initialValues={{ transport: 'Self' }}
            onFinish={freezerBox.editclick === true ? UpdateFreezerBox : CreateNewFreezerBox}
            // onFinish={updateCustomerDetails === true ? updateCustomer : CreateNewFreezerBox}
            form={freezerform}
            layout="vertical"
          >
            <Form.Item
              className="mb-2"
              name="boxnumber"
              label="Box Number"
              rules={[{ required: true, message: false }]}
            >
              <Input
                // disabled={freezerBox.editclick}
                // onChange={(e) => setFreezerBox(pre =>({...pre,onchangevalue:e}))}
                placeholder="box number"
              />
            </Form.Item>

            {
              freezerBox.editclick === true ? <Form.Item
              name='customerid'>
              <Select
            allowClear 
            showSearch
          // size={size}
          placeholder="Please select"
          // onChange={handleChange}
          style={{
            width: '100%',
          }}
          options={datas.customers.filter(cs => cs.isdeleted === false && cs.transport === "Freezer Box").map(item => ({label:item.customername,value:item.id}))}
        />
              </Form.Item> : ''
            }
            </Form>
            </Spin>
      </Modal>

      <Modal
       title={<div className='relative block text-center'>
        <span>FREEZER BOX</span>
        <Button className='absolute right-7 -top-1' onClick={()=>{setFreezerBox(pre =>({...pre,frommodal:true})); freezerform.resetFields()}} type='primary'>Add</Button>
       </div>}
       footer={<></>}
       centered={true}
       width={800} 
       open={freezerBox.modal} 
       onCancel={()=>setFreezerBox(pre =>({...pre,modal:false}))}
              >
              <Spin spinning={freezerBox.spinner}>
              {/* <span>Hi</span> */}
           <Form className="scrollable-container">
            <Table 
            // truncateString
            pagination={false} 
            dataSource={freezerBox.tabledata} 
            className='mt-4 freezerbox-table' 
            columns={freezerboxcolumns}
            scroll={{x:false, y: 400}}
            // virtual 
            />

           
            </Form>
            </Spin>
      </Modal>
    </div>
  )
}
