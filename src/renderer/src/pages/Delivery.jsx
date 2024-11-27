import React, { useEffect, useState, useRef } from 'react'
import { debounce } from 'lodash'
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
  DatePicker,
  Radio,
  Tag,
  Segmented,
  Spin,
  Timeline,
  Badge
} from 'antd'
import { RiHistoryLine } from 'react-icons/ri'
import { PiGarageBold, PiWarningCircleFill } from 'react-icons/pi'
import { MdOutlinePayments } from 'react-icons/md'
import { PiExport } from 'react-icons/pi'
import { TbReportAnalytics } from "react-icons/tb";
import { IoMdAdd, IoMdRemove } from 'react-icons/io'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { TimestampJs } from '../js-files/time-stamp'
const { Search } = Input
const { RangePicker } = DatePicker
import dayjs from 'dayjs'
import { getProductById } from '../firebase/data-tables/products'
import { updateStorage } from '../firebase/data-tables/storage'
import jsonToExcel from '../js-files/json-to-excel'
import { MdAddShoppingCart } from 'react-icons/md'
import {
  createDelivery,
  fetchItemsForDelivery,
  fetchPayDetailsForDelivery,
  getDeliveryById,
  updateDelivery,
  updatePaydetailsChild
} from '../firebase/data-tables/delivery'
import { MdOutlineDoneOutline } from 'react-icons/md'
import { GiCancel } from 'react-icons/gi'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { addDoc, collection, doc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { FaClipboardList } from 'react-icons/fa'
import { TbFileDownload } from 'react-icons/tb'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { getCustomerById } from '../firebase/data-tables/customer'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import companyLogo from '../assets/img/companylogo.png'
import { customRound } from '../js-files/round-amount'
import { TbFileSymlink } from 'react-icons/tb'
import { toDigit } from '../js-files/tow-digit'
import { latestFirstSort, oldestFirstSort } from '../js-files/sort-time-date-sec'
import '../pages/css/Delivery.css'
import { getFreezerbox, getFreezerboxById } from '../firebase/data-tables/freezerbox'
import TableHeight from '../components/TableHeight'
import { ClockCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input
export default function Delivery({ datas, deliveryUpdateMt, storageUpdateMt, customerUpdateMt }) {
  const [form] = Form.useForm()
  const [form2] = Form.useForm()
  const [form4] = Form.useForm()
  const [quicksalepayForm] = Form.useForm()
  const [temform] = Form.useForm()
  const [dateRange, setDateRange] = useState([null, null])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState('')
  const [data, setData] = useState([])
  const [tableLoading, setTableLoading] = useState(true)
  const partialAmountRef = useRef(null)
  const GstBillRef = useRef()
  const [offset, setOffset] = useState(0);
  const chunkSize = 25;
  const [deliveryBill, setDeliveryBill] = useState({
    model: false,
    loading: false,
    state: false,
    data: [],
    prdata: {
      id: '',
      supplierid: '',
      supplier: '',
      date: ''
    },
    open: false,
    totalamount: 0,
    billingamount: 0,
    returnmodeltable: false,
    update: true,
    boxnumber:''
  })

  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true)
      const filteredData = await Promise.all(
        datas.delivery
          .filter((data) => !data.isdeleted && isWithinRange(data.date))
          .slice(offset, offset + chunkSize)
          .map(async (item, index) => {

            const result = await getCustomerById(item.customerid);
            
            const freezerboxResult = item.boxid === '' ? item.boxid : await getFreezerboxById(item.boxid)

            const customerName = result.status === 200 ? result.customer.customername : item.customername
            const mobileNumber = result.status === 200 ? result.customer.mobilenumber : item.mobilenumber
            const gstNumber = result.status === 200 ? result.customer.gstin : item.gstin
            const address = result.status === 200 ? result.customer.location : item.location
            const boxnumber = freezerboxResult.status === 200 && freezerboxResult !== '' ? freezerboxResult.freezerbox.boxnumber : '';
            return {
              ...item,
              sno: index + 1,
              key: item.id || index,
              customername: customerName,
              mobilenumber: mobileNumber,
              gstin:gstNumber,
              location: address,
              boxnumber:boxnumber
            }
          }));
        
      setData((prevData) => (offset === 0 ? filteredData : [...prevData, ...filteredData]));
      setTableLoading(false);
    }
    fetchData()
  }, [datas.delivery, dateRange, offset])

  useEffect(() => {
    setOffset(0);
    setData([]);
  }, [datas.delivery,dateRange]);

  const isWithinRange = (date) => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) {
      return true
    }
    const dayjsDate = dayjs(date, 'DD/MM/YYYY')
    return (
      dayjsDate.isSame(dateRange[0], 'day') ||
      dayjsDate.isSame(dateRange[1], 'day') ||
      (dayjsDate.isAfter(dayjs(dateRange[0])) && dayjsDate.isBefore(dayjs(dateRange[1])))
    )
  }

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

  const handleTableScroll = debounce((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setOffset((prevOffset) => prevOffset + chunkSize);
    }
  }, 200);

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.type).toLowerCase().includes(value.toLowerCase()) ||
          String(record.date).toLowerCase().includes(value.toLowerCase()) ||
          String(record.customername).toLowerCase().includes(value.toLowerCase()) ||
          String(record.billamount).toLowerCase().includes(value.toLowerCase()) ||
          String(record.type).toLowerCase().includes(value.toLowerCase()) ||
          String(record.paymentstatus).toLowerCase().includes(value.toLowerCase()) ||
          String(record.boxnumber).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => {
        const format = 'DD/MM/YYYY'
        const dateA = dayjs(a.date, format)
        const dateB = dayjs(b.date, format)
        return dateB.isAfter(dateA) ? -1 : 1
      },
      // defaultSortOrder: 'descend',
      width: 115,
      editable: false
    },
    {
      title: 'Customer',
      dataIndex: 'customername',
      key: 'customername',
      editable: false
    },
    {
      title: 'Mobile',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: false,
      render: (text, record) => {
        return <span>{text === undefined ? '-' : text}</span>
      }
    },
    {
      title: 'Price',
      dataIndex: 'billamount',
      key: 'billamount',
      width: 130,
      render: (text) => <span>{formatToRupee(text, true)}</span>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      editable: true,
      width: 130,
      sorter: (a, b) => a.type.localeCompare(b.type),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text,record) =>
        text === 'return' ? (
          <span className='flex'><Tag color="red">Return</Tag><Tag color='blue' className={`${record.boxnumber === '' ? 'hidden': 'block'}`}>{record.boxnumber}</Tag></span>
        ) : text === 'quick' ? (
          <Tag color="blue">Quick Sale</Tag>
        ) : text === 'booking' ? (
          <span>
          {record.bookingstatus === 'Delivered' ? (
          <Tag color="green">Booking Delivered</Tag>
        ) : record.bookingstatus === 'Cancelled' ? (
          <Tag color="red">Booking Cancelled</Tag>
        ) : (<Tag color="cyan">Booking</Tag>)
        }
          </span>
        ) : (
          <span className='flex'><Tag color="green">Order</Tag> <Tag color='blue' className={`${record.boxnumber === '' ? 'hidden': 'block'}`}>{record.boxnumber}</Tag></span>
        ),
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentstatus',
      key: 'paymentstatus',
      editable: true,
      width: 155,
      sorter: (a, b) => a.paymentstatus.localeCompare(b.paymentstatus),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text, record) =>
        text === 'Paid' ? (
          <Tag color="green">Paid</Tag>
        ) : text === 'Partial' ? (
          <span className="flex gap-x-0">
            <Tag color="yellow">Partial</Tag>{' '}
            <Tag color="blue">{formatToRupee(record.partialamount, true)}</Tag>
          </span>
        ) : text === 'Return' ? (
          <Tag color="red">Returned</Tag>
        ) : (
          <Tag color="red">Unpaid</Tag>
        )
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
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
          <span className="flex gap-x-3 justify-center items-center">
            <FaClipboardList
              onClick={() =>
                {
                editingKey !== '' ? console.log('Not Clickable') : onOpenDeliveryBill(record),console.log(record)
                }
              }
              size={17}
              className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer text-green-500'}`}
            />
            <Popconfirm
            placement="leftTop"
            // visible={visible}
              className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title={<div>
                <span>Sure to download pdf?</span>
                <section className='flex gap-x-2 mt-2'>
                  <Button loading={loadingGstin} disabled={record.gstin === undefined || record.gstin === '' || record.gstin === null ? true : false} size='small' className='text-[0.7rem]' type='primary' onClick={() => { setLoadingGstin(true); setGstin(true); handleDownloadPdf(record);}} >GST</Button>
                  <Button loading={loadingWithoutGstin} size='small' className='text-[0.7rem]' type='dashed' onClick={() => { setLoadingWithoutGstin(true); setGstin(false); handleDownloadPdf(record);}}>Without GST</Button>
                  {/* <Button size='small' className='text-[0.7rem]' >Cancel</Button> */}
                </section>
              </div>}
              
              disabled={editingKey !== ''}
              onConfirm={null} // Set onConfirm to null
              showCancel={false} // Hides the cancel button
              okButtonProps={{ style: { display: 'none' } }} // Hides the ok button
                      >
              <TbFileDownload
                size={19}
                className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 cursor-pointer hover:text-blue-400'}`}
              />
            </Popconfirm>

            <Popconfirm
              placement="left"
              className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => deleteProduct(record)}
              disabled={editingKey !== ''}
            >
              <AiOutlineDelete
                className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
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
    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          <>
            {dataIndex === 'paymentstatus' ? (
              <Form.Item
                name="paymentstatus"
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                <Select
                  placeholder="Select Payment Status"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
                  options={[
                    { value: 'Unpaid', label: 'Unpaid' },
                    { value: 'Paid', label: 'Paid' }
                  ]}
                />
              </Form.Item>
            ) : (
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
            )}
          </>
        ) : (
          children
        )}
      </td>
    )
  }
  const isEditing = (record) => record.key === editingKey
  const edit = (record) => {
    form.setFieldsValue({ ...record })
    setEditingKey(record.key)
  }
  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'numberofpacks' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    }
  })

  const cancel = () => {
    setEditingKey('')
  }

  //update method
  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)

      if (index != null && row.numberofpacks === key.numberofpacks) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKey('')
      } else {
        await updateDelivery(key.id, {
          numberofpacks: row.numberofpacks,
          updateddate: TimestampJs()
        })
        await deliveryUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKey('')
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  }

  // selection
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const onSelectChange = (newSelectedRowKeys) => {
    newSelectedRowKeys.length === 0 ? setEditingKey('') : setEditingKey('hi')
    if (newSelectedRowKeys.length > 0) {
      const selectTableData = data.filter((item) => newSelectedRowKeys.includes(item.key))
    }
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
            if (index % 2 !== 0) {
              return true
            }
            return false
          })
          setSelectedRowKeys(newSelectedRowKeys)
        }
      }
    ]
  }

  // delete
  const deleteProduct = async (data) => {
    const { id, ...newData } = data;

    let {paymenthistory,status} = await fetchPayDetailsForDelivery(data.id);
    
    if(paymenthistory.length > 0){
      paymenthistory.map(async paydata => {
        await updatePaydetailsChild(id,paydata.id,{isdeleted:true});
       });
    };

    await updateDelivery(id, { isdeleted: true, deleteddate: TimestampJs() })
    deliveryUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  const [firstValue, setFirstValue] = useState(null)
  const [TableEdiable, setTableEdiable] = useState({
    pieceprice: true,
    packs: true,
    margin: true,
    price: true
  })

  const columns2 = [
    {
      title: <span className="text-[0.7rem]">S.No</span>,
      render: (text,record,i) => <span className="text-[0.7rem]">{i+1}</span>,
      width:50
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
      title: <span className="text-[0.7rem]">Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
      editable: TableEdiable.pieceprice,
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width:80
    },
    {
      title: <span className="text-[0.7rem]">Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: TableEdiable.packs,
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width:80
    },
    {
      title: <span className="text-[0.7rem]">MRP</span>,
      dataIndex: 'mrp',
      key: 'mrp',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      width:100
    },
    {
      title: <span className="text-[0.7rem]">Margin</span>,
      dataIndex: 'margin',
      key: 'margin',
      editable: TableEdiable.margin,
      render: (text) => <span className="text-[0.7rem]">{toDigit(text)}</span>,
      width:60
    },
    {
      title: <span className="text-[0.7rem]">Price</span>,
      dataIndex: 'price',
      key: 'price',
      editable: TableEdiable.price,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      width:100
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
              className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => removeTemProduct(record)}
              disabled={editingKey !== ''}
            >
              <AiOutlineDelete
                className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-2">
            <Typography.Link style={{ marginRight: 8 }} onClick={() => tempSingleMargin(record)}>
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => setOption((pre) => ({ ...pre, editingKeys: [] }))}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const columnsReturn = [
    {
      title: <span className="text-[0.7rem]">S.No</span>,
      render: (text,record,i) => <span className="text-[0.7rem]">{i+1}</span>,
      width:50
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
      title: <span className="text-[0.7rem]">Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
      editable: TableEdiable.pieceprice,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      width:90
    },
    {
      title: <span className="text-[0.7rem]">Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: TableEdiable.packs,
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width:70
    },
    {
      title: <span className="text-[0.7rem]">MRP</span>,
      dataIndex: 'mrp',
      key: 'mrp',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      width:90
    },
    {
      title: <span className="text-[0.7rem]">Margin</span>,
      dataIndex: 'margin',
      key: 'margin',
      editable: TableEdiable.margin,
      render: (text) => <span className="text-[0.7rem]">{toDigit(text)}</span>,
      width:75
    },
    {
      title: <span className="text-[0.7rem]">Price</span>,
      dataIndex: 'price',
      key: 'price',
      editable: TableEdiable.price,
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      width:90
    },
    {
      title: <span className="text-[0.7rem]">Return Type</span>,
      dataIndex: 'returntype',
      key: 'returntype',
      editable: true,
      width:90,
      render: (text) => {
        return text === 'damage' ? (
          <Tag color="red" className="text-[0.7rem]">
            Damage
          </Tag>
        ) : (
          <Tag color="blue" className="text-[0.7rem]">
            Normal
          </Tag>
        )
      }
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
              className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => removeTemProduct(record)}
              disabled={editingKey !== ''}
            >
              <AiOutlineDelete
                className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-2">
            <Typography.Link style={{ marginRight: 8 }} onClick={() => tempSingleMargin(record)}>
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => setOption((pre) => ({ ...pre, editingKeys: [] }))}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  //Save
  const tempSingleMargin = async (data) => {
    const row = await temform.validateFields()
    let initialtype = row.returntype === undefined ? 'normal' : row.returntype
    const oldtemDatas = option.tempproduct
    let updatedTempproduct

    try {
      // margin
      if (row.margin !== data.margin && TableEdiable.margin) {
        let mrp = data.numberofpacks * data.productprice
        updatedTempproduct = oldtemDatas.map((product) =>
          product.key === data.key
            ? {
                ...product,
                numberofpacks: data.numberofpacks,
                margin: row.margin,
                price: customRound(mrp - (mrp * row.margin) / 100),
                mrp: mrp,
                returntype: row.returntype === undefined ? 'normal' : row.returntype
              }
            : product
        )
        let totalAmounts = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpAmount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        setMarginValue((pre) => ({ ...pre, amount: customRound(totalAmounts) }))
        setTotalAmount(mrpAmount)
        setOption((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          editingKeys: []
        }))
        message.open({ type: 'success', content: 'Updated successfully' })
        setFirstValue(null)
      }
      // piece price
      else if (row.productprice !== data.productprice && TableEdiable.pieceprice) {
        updatedTempproduct = oldtemDatas.map((product) => {
          let mrpNormal = data.numberofpacks * data.productprice
          let mrpData = row.productprice * data.numberofpacks

          let marginvalue = ((data.productprice - row.productprice) / data.productprice) * 100
          let price = mrpData - mrpData * (0 / 100)
          if (product.key === data.key) {
            return {
              ...product,
              numberofpacks: data.numberofpacks,
              margin: marginvalue,
              price: customRound(price),
              mrp: mrpNormal,
              returntype: row.returntype === undefined ? 'normal' : row.returntype
            }
          }
          return product
        })
        let totalAmounts = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpAmount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        setMarginValue((pre) => ({ ...pre, amount: customRound(totalAmounts) }))
        setTotalAmount(mrpAmount)
        setOption((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          editingKeys: []
        }))
        message.open({ type: 'success', content: 'Updated successfully' })
        setFirstValue(null)
      }
      // packs
      else if (row.numberofpacks !== data.numberofpacks && TableEdiable.packs) {
        updatedTempproduct = oldtemDatas.map((product) => {
          let mrpData = row.numberofpacks * data.productprice
          let price = mrpData - mrpData * (data.margin / 100)
          if (product.key === data.key) {
            return {
              ...product,
              numberofpacks: row.numberofpacks,
              margin: data.margin,
              price: customRound(price),
              mrp: mrpData,
              returntype: row.returntype === undefined ? 'normal' : row.returntype
            }
          }
          return product
        })
        let totalAmounts = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpAmount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        setMarginValue((pre) => ({ ...pre, amount: customRound(totalAmounts) }))
        setTotalAmount(mrpAmount)
        setOption((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          editingKeys: []
        }))
        message.open({ type: 'success', content: 'Updated successfully' })
        setFirstValue(null)
      }
      // price
      else if (row.price !== data.price && TableEdiable.price) {
        updatedTempproduct = oldtemDatas.map((product) => {
          let mrpData = data.numberofpacks * data.productprice
          let price = row.price
          if (product.key === data.key) {
            return {
              ...product,
              numberofpacks: data.numberofpacks,
              margin: ((mrpData - row.price) / mrpData) * 100,
              price: customRound(price),
              mrp: mrpData,
              returntype: row.returntype === undefined ? 'normal' : row.returntype
            }
          }
          return product
        })
        let totalAmounts = updatedTempproduct.map((data) => data.price).reduce((a, b) => a + b, 0)
        let mrpAmount = updatedTempproduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
        setMarginValue((pre) => ({ ...pre, amount: customRound(totalAmounts) }))
        setTotalAmount(mrpAmount)
        setOption((pre) => ({
          ...pre,
          tempproduct: updatedTempproduct,
          editingKeys: []
        }))
        message.open({ type: 'success', content: 'Updated successfully' })
        setFirstValue(null)
      }
      // all are same
      else if (
        row.margin === data.margin ||
        row.numberofpacks === data.numberofpacks ||
        initialtype === data.returntype ||
        row.productprice === data.productprice ||
        row.price === data.price
      ) {
        message.open({ content: 'No changes made', type: 'info' })
        setOption((pre) => ({
          ...pre,
          editingKeys: []
        }))
        setFirstValue(null)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const [option, setOption] = useState({
    customer: [],
    customerstatus: true,
    flavour: [],
    flavourstatus: true,
    product: [],
    productvalue: '',
    quantity: [],
    quantitystatus: true,
    tempproduct: [],
    editingKeys: [],
    freezerboxs:[]
  })

  //product initial value
  useEffect(() => {

    const productOp = datas.product
      .filter(
        (item, i, s) =>
          item.isdeleted === false 
        // && s.findIndex((item2) => item2.productname === item.productname) === i
      )
      .map((data) => ({ label: data.productname, value: data.productname }))
    setOption((pre) => ({ ...pre, product: productOp }))

    const optionscustomers = datas.customers
      .filter((item) => item.isdeleted === false)
      .map((item) => ({ label: item.customername, value: item.id }))
    setOption((pre) => ({ ...pre, customer: optionscustomers }))
  }, [])

  // deliver date onchange
  const sendDeliveryDateOnchange = (value, i) => {
    // form2.resetFields(['customername'])
    // form2.resetFields(['productname'])
    // form2.resetFields(['flavour'])
    // form2.resetFields(['quantity'])
    // form2.resetFields(['numberofpacks'])
    // setOption((pre) => ({ ...pre, customerstatus: false, tempproduct: [] }))
    // setTotalAmount(0)
    // setMarginValue({ amount: 0, discount: 0, percentage: 0 })
    // form5.resetFields(['marginvalue'])
  }

  // customer onchange value
  const [lastOrderData, setLastOrderData] = useState({
    customerdetails: {},
    products: []
  })

  const [lastOrderBtnState, setlastOrderBtnState] = useState(true)
  const [freezerBoxState,setFreezerBoxState] = useState(false);

  const customerOnchange = debounce(async (value, i) => {

    let filterBoxs = datas.freezerbox.filter(data => data.customerid === value).map(box =>({label:box.boxnumber,value:box.id}));
    setOption(pre=>({...pre,freezerboxs:filterBoxs}));

  setFreezerBoxState(filterBoxs.length === 0 ? true : false)
    if (returnDelivery.state === false) {
      setlastOrderBtnState(true)
      // get last order data
      let lastOrderDatas = datas.delivery.filter( (data) => data.customerid === value && data.type === 'order')
      
      if (lastOrderDatas.length > 0) {
        
        let latestOrderData = await latestFirstSort(lastOrderDatas)
        latestOrderData = latestOrderData.length > 0 ? latestOrderData[0] : []
        
        let { items, status } = await fetchItemsForDelivery(latestOrderData.id)
        
        if (status) {
          let customerDetails = lastOrderDatas[0]
          let products = await Promise.all(
            items.map(async (item) => {
              let { product, status } = await getProductById(item.id)
              if (status) {
                return {
                  ...item,
                  ...product
                }
              }
            }));

          // console.log(products);
          let compainddata = [...lastOrderData.products, ...products];
          
          let uniqueArray = [...new Map(compainddata.map((item) => [item.id, item])).values()];
          // console.log(compainddata);
          
          setLastOrderData({ customerdetails: customerDetails, products: uniqueArray });
        }
        setlastOrderBtnState(false)
      }
    }
    // end last order data
    form2.resetFields(['productname'])
    form2.resetFields(['flavour'])
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    form2.resetFields(['boxnumber'])

    if (lastOrderData.products.length > 0) {
    } else {
      setOption((pre) => ({ ...pre, customerstatus: false, tempproduct: [] }));
      setTotalAmount(0)
      form5.resetFields(['marginvalue'])
      setMarginValue({ amount: 0, discount: 0, percentage: 0 })
    }
  }, 300)

  const[productCount,setProductCount] = useState(0);
  //product onchange value
  const productOnchange = debounce((value, i) => {
    // form2.resetFields(['flavour'])
    // form2.resetFields(['quantity'])
    // form2.resetFields(['numberofpacks'])
    form5.resetFields(['marginvalue']);
   
    let productid = datas.product.find(data => (data.productname === value) && (data.isdeleted === false)).id;
    let numberofpackCount = datas.storage.find(data => (data.productid === productid) && data.isdeleted === false ).numberofpacks;
    setProductCount(numberofpackCount);
    
    // setMarginValue({ amount: 0, discount: 0, percentage: 0 })
    // const flavourOp = Array.from(
    //   new Set(datas.product.filter((item) => item.isdeleted === false && item.productname === value)
    //       .map((data) => data.flavour))).map((flavour) => ({ label: flavour, value: flavour }));
    // setOption((pre) => ({
    //   ...pre,
    //   flavourstatus: false,
    //   // flavour: flavourOp,
    //   productvalue: value,
    //   quantitystatus: true
    // }))
  }, 200)

  //flavour onchange value
  const flavourOnchange = debounce(async (value, i) => {
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    form5.resetFields(['marginvalue'])
    setMarginValue({ amount: 0, discount: 0, percentage: 0 })
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
  }, 300)

  // create add tem product
  const [count, setCount] = useState(0)
  const [totalamount, setTotalAmount] = useState(0)

  const createTemDeliveryMt = debounce(async (values) => {
    setCount(count + 1)
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    // let [quantityvalue, units] = values.quantity.split(' ')
    const findPrice = await datas.product.find(
      (item) =>
        item.isdeleted === false &&
        item.productname === values.productname 
        // && item.flavour === values.flavour &&
        // item.quantity === Number(quantityvalue) &&
        // item.unit === units
    ).price

    const newProduct = {
      ...values,
      key: count,
      date: formattedDate,
      createddate: TimestampJs(),
      mrp: findPrice * values.numberofpacks,
      productprice: findPrice,
      margin: 0,
      price: findPrice * values.numberofpacks
    }

    // console.log(newProduct);

    // console.log(option.tempproduct);

    const checkExsit = option.tempproduct.some(
      (item) =>
        item.customername === newProduct.customername &&
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        // item.numberofpacks === newProduct.numberofpacks &&
        // item.date === newProduct.date &&
        item.returntype === newProduct.returntype
    )

    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
    } else {
      let compainData = [...option.tempproduct, newProduct]
      // console.log(compainData);

      let netamt = compainData.map((data) => data.price).reduce((a, b) => a + b, 0)

      setOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newProduct] }))
      setTotalAmount((pre) => pre + findPrice * values.numberofpacks)
      setMarginValue((pre) => ({ ...pre, amount: netamt, paymentstaus: 'Paid' }))
      // let marginamount = totalamount * (0 / 100)
      // let finalamounts = customRound(totalamount - marginamount)
      // setMarginValue((pre) => ({
      //   ...pre,
      //   amount: finalamounts,
      //   percentage: value.marginvalue,
      //   discount: marginamount,
      //   paymentstaus: 'Paid'
      // }));
      // let newData = option.tempproduct.map((item) => {
      //   let marginamount = item.mrp * ( 0 / 100)
      //   let finalamounts = customRound(item.mrp - marginamount)
      //   return {
      //     ...item,
      //     price: finalamounts,
      //     margin: 0
      //   }
      // });
      // setOption((pre) => ({ ...pre, tempproduct: newData }));

      //old code
      // setTotalAmount((pre) => pre + findPrice * values.numberofpacks)
      // setOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newProduct] }))
      // deliveryUpdateMt()
      // setMarginValue({ amount: 0, discount: 0, percentage: 0, paymentstaus: 'Paid' })
      form5.resetFields(['marginvalue'])
      form4.resetFields(['partialamount'])
      form4.setFieldsValue({ paymentstatus: 'Paid' })
    }
  }, 200)

  // remove temp product
  const removeTemProduct = (key) => {
    const newTempProduct = option.tempproduct.filter((item) => item.key !== key.key)
    newTempProduct.length <= 0 ? setTotalAmount(0) : setTotalAmount((pre) => pre - key.price)
    let netamt = newTempProduct.map((data) => data.price).reduce((a, b) => a + b, 0)
    let totalmt = newTempProduct.map((data) => data.mrp).reduce((a, b) => a + b, 0)
    setTotalAmount(totalmt)
    setOption((pre) => ({ ...pre, tempproduct: newTempProduct }))
    setMarginValue((pre) => ({ ...pre, amount: netamt }))
    form4.setFieldsValue({ paymentstatus: 'Paid' })
  }

  const [isDeliverySpiner, setIsDeliverySpiner] = useState(false)

  // add new delivery
  const addNewDelivery = async () => {
    if (dayjs(form2.getFieldValue().date).format('DD/MM/YYYY') === 'Invalid Date') {
      return message.open({ type: 'info', content: 'Please choose the correct date' })
    }

    setEditingKey('')
    setIsDeliverySpiner(true)

    let productItems = option.tempproduct.flatMap((temp, tempIndex) =>
      datas.product
        .filter(
          (pr) =>
            temp.productname === pr.productname && 
            pr.isdeleted === false 
            // && temp.flavour === pr.flavour &&
            // pr.quantity == temp.quantity.split(' ')[0] &&
            // pr.unit === temp.quantity.split(' ')[1]
        )
        .map((pr) => ({
          numberofpacks: temp.numberofpacks,
          id: pr.id,
          returntype: temp.returntype,
          margin: temp.margin === '' ? 0 : temp.margin,
          sno: tempIndex + 1
        })));

    // Partial amount (value)
    let { partialamount,paymentmode } = form4.getFieldsValue()
    let { customername } = form2.getFieldsValue()
    // Create delivery new
    const newDelivery = returnDelivery.state === true ? {
            customerid: customername,
            date: dayjs(form2.getFieldValue().date).format('DD/MM/YYYY'),
            total: totalamount,
            billamount: option.tempproduct.map((data) => data.price).reduce((a, b) => a + b, 0),
            paymentstatus: 'Return',
            partialamount: partialamount === undefined || partialamount === null ? 0 : partialamount,
            isdeleted: false,
            type: returnDelivery.state === true ? 'return' : 'order',
            createddate: TimestampJs(),
            boxid:form2.getFieldsValue().boxnumber === undefined ? '' : form2.getFieldsValue().boxnumber
          }
        : {
            customerid: customername,
            date: dayjs(form2.getFieldValue().date).format('DD/MM/YYYY'),
            total: totalamount,
            billamount: marginValue.amount,
            // paymentstatus: marginValue.paymentstaus,
            paymentstatus: form4.getFieldsValue().paymentstatus,
            partialamount: partialamount === undefined || partialamount === null ? 0 : partialamount,
            paymentmode: marginValue.paymentstaus === 'Unpaid' ? '' : paymentmode,
            isdeleted: false,
            type: returnDelivery.state === true ? 'return' : 'order',
            createddate: TimestampJs(),
            boxid:form2.getFieldsValue().boxnumber === undefined ? '' : form2.getFieldsValue().boxnumber
          }
          
          
    
    // console.log(newDelivery);
    try {
      const deliveryCollectionRef = collection(db, 'delivery')
      const deliveryDocRef = await addDoc(deliveryCollectionRef, newDelivery)
      const itemsCollectionRef = collection(deliveryDocRef, 'items')
      setOption((prev) => ({ ...prev, tempproduct: [] }))
      // console.log(productItems)
      for (const item of productItems) {
        // console.log(item,productItems)
        await addDoc(itemsCollectionRef, item)

        const { product, status } = await getProductById(item.id)

        if (status === 200) {
          const existingProduct = datas.storage.find( (storageItem) => storageItem.productid === product.id && storageItem.category === 'Product List');

          if (returnDelivery.state === true && item.returntype === 'normal') {
            await updateStorage(existingProduct.id, {
              numberofpacks: existingProduct.numberofpacks + item.numberofpacks,
              margin: item.margin === '' ? 0 : item.margin
            })
          } else if (returnDelivery.state === true && item.returntype === 'damage') {
            // console.log('damage')
          } else {
            await updateStorage(existingProduct.id, {
              numberofpacks: existingProduct.numberofpacks - item.numberofpacks,
              margin: item.margin === '' ? 0 : item.margin
            })
          }
        }
      }
      message.open({
        type: 'success',
        content:
          returnDelivery.state === true
            ? 'Product returned successfully'
            : 'Product delivered successfully'
      })
      await deliveryUpdateMt()
      await customerUpdateMt()
      await storageUpdateMt()
    } catch (e) {
      console.error('Error adding delivery: ', e)
      message.open({ type: 'error', content: `${e} Error ${returnDelivery.state === true ? 'return' : 'adding' }  delivery` })
    } finally {
      setTotalAmount(0)
      setMarginValue((pre) => ({ ...pre, amount: 0 }))
      form5.resetFields(['marginvalue'])
      form4.resetFields(['partialamount'])
      // await setIsDeliverySpiner(true)
      warningModalOk()
      setIsDeliverySpiner(false)
      setTableLoading(false)
    }
    
  }

  // model close
  const modelCancel = async () => {
    if (option.tempproduct.length > 0 && isDeliverySpiner === false) {
      setIsCloseWarning(true)
    } else {
      setIsCloseWarning(false)
      setIsModalOpen(false)
      form2.resetFields()
      form5.resetFields(['marginvalue'])
      form4.resetFields(['partialamount'])
      setOption((pre) => ({
        ...pre,
        tempproduct: [],
        flavour: [],
        flavourstatus: true,
        quantity: [],
        quantitystatus: true,
        customerstatus: true
      }))
      setCount(0)
      setTotalAmount(0)
      setMarginValue({ amount: 0, discount: 0, percentage: 0 })
      form4.setFieldsValue({ paymentstatus: 'Paid' })
      setLastOrderData({ customerdetails: {}, products: [] })
      setlastOrderBtnState(true)
      setOption((pre) => ({ ...pre, editingKeys: [] }))
    }
  }

  const warningModalOk = () => {
    setIsCloseWarning(false)
    setIsModalOpen(false)
    form2.resetFields()
    form5.resetFields(['marginvalue'])
    form4.resetFields(['partialamount'])
    setOption((pre) => ({
      ...pre,
      tempproduct: [],
      flavour: [],
      flavourstatus: true,
      quantity: [],
      quantitystatus: true,
      customerstatus: true
    }))
    setCount(0)
    setTotalAmount(0)
    setMarginValue({ amount: 0, discount: 0, percentage: 0 })
    form4.setFieldsValue({ paymentstatus: 'Paid' })
    setLastOrderData({ customerdetails: {}, products: [] })
    setlastOrderBtnState(true)
    setOption((pre) => ({ ...pre, editingKeys: [] }))
  }

  // export Excel
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const specificData = exportDatas.map((item, index) => ({
      No: index + 1,
      Date: item.date,
      Name: item.customername,
      Mobile: item.mobilenumber,
      GSTIN: item.gstin,
      Location: item.location,
      Type: item.type,
      Total: item.total,
      Billed: item.billamount,
      Partial: item.partialamount,
      Status: item.paymentstatus,
      Mode: item.paymentmode
    }));
    jsonToExcel(specificData, `Delivery-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKey('')
  }

   // export PDF
   const exportPDF = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    let allInvoiceData = [];
    console.log(allInvoiceData)
    for(let record of exportDatas){
    const { items, status } = await fetchItemsForDelivery(record.id)
    const { freezerbox } = await getFreezerboxById(record.boxid);
    let boxnumber = freezerbox === undefined ? '' : freezerbox.boxnumber;
    if (status === 200) {
      let prData = datas.product.filter((item) => items.find((item2) => item.id === item2.id))
      let prItems = prData.flatMap((pr) => {
        let matchingItems = items.filter((item) => item.id === pr.id);
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
            returntype: matchingData.returntype,
        }));
      });
      prItems.sort((a, b) => a.sno - b.sno);
      allInvoiceData.push({
        data: prItems,
        customerdetails: {
          ...record,
          boxnumber: boxnumber
        },
      });
    }
    }
    const pdf = new jsPDF();
    const imgWidth = 210
    const pageHeight = 297
    for(let invoice of allInvoiceData){
      await new Promise((resolve) => {
        setInvoiceDatas({
          data: invoice.data,
          customerdetails: invoice.customerdetails,
        });
        setTimeout(resolve, 300);
      })
        const element = printRef.current;
        const canvas = await html2canvas(element);
        const data = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(data, 'PNG', 0, 0, imgWidth, imgHeight);
        let heightLeft = imgHeight - pageHeight;
        while (heightLeft > 0) {
            pdf.addPage();
            pdf.addImage(data, 'PNG', 0, heightLeft - imgHeight, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        if (invoice !== allInvoiceData[allInvoiceData.length - 1]) {
            pdf.addPage();
        }
      }
      const lastInvoice = allInvoiceData[allInvoiceData.length - 1];
      pdf.save(`Report-${lastInvoice.customerdetails.date}.pdf`);
      setSelectedRowKeys([])
      setEditingKey('')
  }

  // material used
  const columns3 = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      editable: false
    },
    {
      title: 'Material',
      dataIndex: 'material',
      key: 'material',
      editable: true
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        return (
          <Popconfirm
            className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
            title="Sure to delete?"
            onConfirm={() => removeTemMaterial(record)}
            disabled={editingKey !== ''}
          >
            <AiOutlineDelete
              className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
              size={19}
            />
          </Popconfirm>
        )
      }
    }
  ]

  const [form3] = Form.useForm()
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false)
  const [mtOption, setMtOption] = useState({
    material: [],
    tempproduct: [],
    count: 0
  })

  useEffect(() => {
    const optionsuppliers = datas.suppliers
      .filter(
        (item, i, self) =>
          item.isdeleted === false &&
          i === self.findIndex((d) => d.materialname === item.materialname)
      )
      .map((item) => ({ label: item.materialname, value: item.materialname }))
    setMtOption((pre) => ({ ...pre, material: optionsuppliers }))
  }, [])

  // create material
  const createTemMaterial = async (values) => {
    setMtOption((pre) => ({ ...pre, count: pre.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const newMaterial = {
      ...values,
      date: formattedDate,
      key: mtOption.count,
      createddate: TimestampJs(),
      isdeleted: false,
      quantity: values.quantity + ' ' + values.unit
    }

    const checkExsit = mtOption.tempproduct.find(
      (item) => item.material === newMaterial.material && item.date === newMaterial.date
    )

    const dbcheckExsit = datas.usedmaterials.find(
      (item) => item.material === newMaterial.material && item.date === newMaterial.date
    )

    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (dbcheckExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else {
      setMtOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newMaterial] }))
    }
  }

  // remove tem material
  const removeTemMaterial = (key) => {
    const newTempProduct = mtOption.tempproduct.filter((item) => item.key !== key.key)
    setMtOption((pre) => ({ ...pre, tempproduct: newTempProduct }))
  }

  // add new material to data base
  const addNewTemMaterial = async () => {
    mtOption.tempproduct.map(async (item, i) => {
      let { key, quantity, ...newMaterial } = item
      let quntity = Number(quantity.split(' ')[0])
      await createDelivery({ ...newMaterial, quantity: quntity })
    })
    usedmaterialUpdateMt()
    materialModelCancel()
  }

  // model cancel
  const materialModelCancel = () => {
    setIsMaterialModalOpen(false)
    form3.resetFields()
    setMtOption((pre) => ({ ...pre, tempproduct: [], count: 0 }))
  }

  const [form5] = Form.useForm()
  const [marginValue, setMarginValue] = useState({
    amount: 0,
    discount: 0,
    percentage: 0,
    paymentstaus: 'Paid',
    particalAmount: 0
  })

  const onPriceChange = debounce((value) => {
    let marginamount = totalamount * (value.marginvalue / 100)
    let finalamounts = customRound(totalamount - marginamount)

    setMarginValue((pre) => ({
      ...pre,
      amount: finalamounts,
      percentage: value.marginvalue,
      discount: marginamount
    }))

    let newData = option.tempproduct.map((item) => {
      let marginamount = item.mrp * (value.marginvalue / 100)
      let finalamounts = customRound(item.mrp - marginamount)
      return {
        ...item,
        price: finalamounts,
        margin: value.marginvalue
      }
    })
    setOption((pre) => ({ ...pre, tempproduct: newData }))
  }, 300)

  const radioOnchange = debounce((e) => {
    setMarginValue((pre) => ({ ...pre, paymentstaus: e.target.value }))
    form4.resetFields(['partialamount'])
    if (e.target.value === 'Partial') {
      if (partialAmountRef.current) {
        setTimeout(() => {
          if (partialAmountRef.current) {
            const inputField = form.getFieldInstance('partialamount')
            if (inputField) {
              inputField.focus()
            }
          }
        }, 0)
      }
    }
  }, 200)

  // Ref for get items collections
  const deliveryColumns = [
    {
      title: 'S.No',
      key: 'sno',
      dataIndex: 'sno',
      width: 80,
      // render: (text, record, i) => <span>{i + 1}</span>
    },
    {
      title: 'Product',
      key: 'productname',
      dataIndex: 'productname'
    },
    // {
    //   title: 'Flavour',
    //   key: 'flavour',
    //   dataIndex: 'flavour'
    // },
    // {
    //   title: 'Size',
    //   key: 'quantity',
    //   dataIndex: 'quantity',
    //   width: 100
    // },
    {
      title: 'Rate',
      key: 'pieceamount',
      dataIndex: 'pieceamount',
      width: 120,
      render: (text) => <span>{text}</span>
    },
    {
      title: 'Qty',
      key: 'numberofpacks',
      dataIndex: 'numberofpacks',
      width: 140
    },
    {
      title: 'MRP',
      key: 'producttotalamount',
      dataIndex: 'producttotalamount',
      width: 100,
      render: (text) => <span>{formatToRupee(text, true)}</span>
    },
    {
      title: deliveryBill.returnmodeltable === false ? 'Margin' : 'Margin',
      key: deliveryBill.returnmodeltable === false ? 'margin' : 'returntype',
      dataIndex: deliveryBill.returnmodeltable === false ? 'margin' : 'returntype',
      render: (text, record) => {
        if (deliveryBill.returnmodeltable === false) {
          return text === undefined ? `0%` : <span>{toDigit(text)}%</span>
        } else {
          return text === 'damage' ? (
            <span className="flex justify-center items-center gap-x-1">
              {' '}
              <span>{toDigit(record.margin)}%</span>{' '}
              <Tag color="red" className="text-[0.7rem]">
                Damage
              </Tag>
            </span>
          ) : (
            <span className="flex justify-center items-center gap-x-1">
              {toDigit(record.margin)}% <Tag color="blue">Normal</Tag>
            </span>
          )
        }
      },
      width: deliveryBill.returnmodeltable === false ? 80 : 120
    },
    {
      title: 'Amount',
      key: 'price',
      dataIndex: 'price',
      render: (text) => <span>{formatToRupee(text, true)}</span>
    }
  ]

  const [updateDeliveryState, setUpdateDeliveryState] = useState(false)

  useEffect(() => {
    const getItems = async () => {
      if (deliveryBill.prdata.id !== '') {
        setDeliveryBill((pre) => ({ ...pre, loading: true }))

        const { items, status } = await fetchItemsForDelivery(deliveryBill.prdata.id)
        const { paymenthistory } = await fetchPayDetailsForDelivery(deliveryBill.prdata.id)
        
        
        if (status === 200) {
          let prItems = datas.product.flatMap((item) =>
            items
              .filter((item2) => item.id === item2.id)
              .map((item2, i) => {
                return {
                  sno: item2.sno,
                  ...item,
                  returntype: item2.returntype,
                  pieceamount: item.price,
                  quantity: `${item.quantity} ${item.unit}`,
                  margin: item2.margin,
                  price: customRound(
                    item2.numberofpacks * item.price -
                      item2.numberofpacks * item.price * (item2.margin / 100)
                  ),
                  numberofpacks: item2.numberofpacks,
                  producttotalamount: item2.numberofpacks * item.price
                }
              })
          )

          console.log(deliveryBill);

          setDeliveryBill((pre) => ({
            ...pre,
            data: {
              items: prItems,
              ...deliveryBill.prdata,
              paymenthistory: paymenthistory.length > 0 ? paymenthistory : [],
              
            }
          }))
        }

        setDeliveryBill((pre) => ({ ...pre, loading: false }))
      }
    }
    getItems()
  }, [
    deliveryBill.open,
    // updateDeliveryState
    deliveryBill.update
  ])

  const onOpenDeliveryBill = debounce(async (data) => {
    
    let {freezerbox} = await getFreezerboxById(data.boxid);
    let boxnumber = freezerbox === undefined ? '' : freezerbox.boxnumber 

    setDeliveryBill((pre) => ({
      ...pre,
      model: true,
      prdata: data,
      open: !deliveryBill.open,
      // open: !pre.open,
      returnmodeltable: data.type === 'return' ? true : false,
      boxnumber:boxnumber
    }))
  }, 200)

  // return
  const [returnDelivery, setReturnDelivery] = useState({
    state: false
  })

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
      inputType === 'number' ? (
        <InputNumber className="w-[4rem]" size="small" min={0} max={100} type="number" />
      ) : (
        <InputNumber className="w-[4rem]" size="small" min={1} type="number" />
      )
    return (
      <td {...restProps}>
        {editing ? (
          dataIndex === 'returntype' ? (
            <Form.Item
              name="returntype"
              style={{ margin: 0 }}
              rules={[{ required: true, message: false }]}
            >
              <Select
                options={[
                  { label: 'Normal', value: 'normal' },
                  { label: 'Damage', value: 'damage' }
                ]}
                size="small"
                dropdownRender={(menu) => (
                  <div>
                    {menu}
                    <style jsx>{`
                      .ant-select-item-option-content {
                        font-size: 0.6rem;
                      }
                    `}</style>
                  </div>
                )}
              />
            </Form.Item>
          ) : dataIndex === 'numberofpacks' ? (
            <Form.Item
              name="numberofpacks"
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
              <InputNumber
                onFocus={(e) => {
                  if (firstValue === null) {
                    setFirstValue(e.target.value)
                    setTableEdiable({ margin: false, packs: true, pieceprice: false, price: false })
                  }
                }}
                type="number"
                size="small"
                className="w-[4rem]"
                min={1}
              />
            </Form.Item>
          ) : dataIndex === 'margin' ? (
            <Form.Item
              name="margin"
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
              <InputNumber
                type="number"
                onFocus={(e) => {
                  if (firstValue === null) {
                    setFirstValue(e.target.value) // Store the first value
                    setTableEdiable({ margin: true, packs: false, pieceprice: false, price: false })
                  }
                }}
                size="small"
                className="w-[4rem]"
                min={0}
                max={100}
              />
            </Form.Item>
          ) : dataIndex === 'price' ? (
            <Form.Item
              name="price"
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
              <InputNumber
                onFocus={(e) => {
                  if (firstValue === null) {
                    setFirstValue(e.target.value) // Store the first value
                    setTableEdiable({ margin: false, packs: false, pieceprice: false, price: true })
                  }
                }}
                size="small"
                className="w-[4rem]"
                min={0}
              />
            </Form.Item>
          ) : dataIndex === 'productprice' ? (
            <Form.Item
              name="productprice"
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
              <InputNumber
                onFocus={(e) => {
                  if (firstValue === null) {
                    setFirstValue(e.target.value) // Store the first value
                    setTableEdiable({ margin: false, packs: false, pieceprice: true, price: false })
                  }
                }}
                size="small"
                className="w-[4rem]"
                min={0}
              />
            </Form.Item>
          ) : (
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
          )
        ) : (
          children
        )}
      </td>
    )
  }

  const isEditionTemp = (re) => {
    return option.editingKeys.includes(re.key)
  }

  const temTbEdit = (re) => {
    setFirstValue(null)
    setTableEdiable({
      pieceprice: true,
      packs: true,
      margin: true,
      price: true
    })
    temform.setFieldsValue({ ...re })
    setOption((pre) => ({ ...pre, editingKeys: [re.key] }))
  }
  // columnsReturn
  const tempMergedColumns =
    returnDelivery.state === true
      ? columnsReturn.map((col) => {
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
      : columns2.map((col) => {
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

  const cancelTemTable = () => {
    setOption((pre) => ({ ...pre, editingKeys: [] }))
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

  // html to pdf
  const printRef = useRef()
  const [invoiceDatas, setInvoiceDatas] = useState({
    data: [],
    isGenerate: false,
    customerdetails: {}
  })

  const [gstin,setGstin] = useState(false);
  const [loadingGstin, setLoadingGstin] = useState(false);
  const [loadingWithoutGstin, setLoadingWithoutGstin] = useState(false);

  const handleDownloadPdf = async (record) => {
    const { items, status } = await fetchItemsForDelivery(record.id)
    const { freezerbox } = await getFreezerboxById(record.boxid);
    let boxnumber = freezerbox === undefined ? '' : freezerbox.boxnumber;
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
      // });

      let prItems = prData.flatMap((pr, i) => {
        // Get all matching items with the same id
        let matchingItems = items.filter((item) => item.id === pr.id);
        
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
            returntype: matchingData.returntype,
        }));
      });

      prItems.sort((a, b) => a.sno - b.sno);
      setInvoiceDatas((pre) => ({
        ...pre,
        data: prItems,
        isGenerate: true,
        customerdetails: {
          ...record,
          boxnumber: boxnumber
        },
      }));}
      // console.log(record);
      setLoadingGstin(false);
      setLoadingWithoutGstin(false);
  }

  useEffect(() => {
    const generatePDF = async () => {
      if (invoiceDatas.isGenerate) {
        const element = gstin === true ? GstBillRef.current : printRef.current
        const canvas = await html2canvas(element)
        const data = canvas.toDataURL('image/png')
        const pdf = new jsPDF()
        const imgWidth = 210
        const pageHeight = 297
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight
        let position = 0
        pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
        while (heightLeft > 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(data, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }
        pdf.save(
          `${invoiceDatas.customerdetails.customername}-${invoiceDatas.customerdetails.date}-${TimestampJs().split(' ')[1]}.pdf`
        )
        setInvoiceDatas((pre) => ({ ...pre, isGenerate: false }));
        setGstin(false);
      }
    }
    generatePDF()
    
  }, [invoiceDatas.isGenerate, printRef])

  const [isCloseWarning, setIsCloseWarning] = useState(false)
  const customerRef = useRef(null)

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        if (customerRef.current) {
          customerRef.current.focus()
        }
      }, 0) // Slight delay to ensure modal is fully rendered
    }
  }, [isModalOpen])

  // last order pull button
  const lastOrderBtn = async () => {
    let itemsObject = lastOrderData.products.sort((a, b) => a.sno - b.sno).map((data, i) => ({
      createddate: TimestampJs(),
      customername: lastOrderData.customerdetails.customerid,
      date: form2.getFieldValue().date ? form2.getFieldValue().date.format('DD/MM/YYYY') : '',
      // flavour: data.flavour,
      key: i + 1,
      margin: data.margin,
      mrp: data.numberofpacks * data.price,
      numberofpacks: data.numberofpacks,
      price:
        data.numberofpacks * data.price - (data.numberofpacks * data.price * data.margin) / 100,
      productname: data.productname,
      productprice: data.price,
      // quantity: data.quantity + ' ' + data.unit,
      returntype: data.returntype
    }))

    console.log(lastOrderData.products);
    
    let mrpValue = lastOrderData.products
      .map((data, i) => data.numberofpacks * data.price)
      .reduce((a, b) => a + b, 0)
    let netValue = lastOrderData.products
      .map(
        (data, i) =>
          data.numberofpacks * data.price - (data.numberofpacks * data.price * data.margin) / 100
      )
      .reduce((a, b) => a + b, 0)
    setCount(lastOrderData.products.length + 1)
    setTotalAmount(customRound(mrpValue))
    setMarginValue((pre) => ({ ...pre, amount: customRound(netValue), paymentstaus: 'Paid' }))
    setOption((pre) => ({ ...pre, tempproduct: itemsObject }))
    setlastOrderBtnState(true)
    // setMarginValue({ amount: 0, discount: 0, percentage: 0, paymentstaus: 'Paid' })
    // console.log(itemsObject);Fuse
  }

  // quick sale pay
  const [quickSalePay, setQuickSalePay] = useState({ modal: false, loading: false })

  const openQuickSaleModalMt = () => {
    setPayModalState((pre) => ({ ...pre, btndisable: false, type: 'create' }))
    quicksalepayForm.setFieldsValue({
      amount: deliveryBill.data.billamount - deliveryBill.data.partialamount
    })
    setPopupModal((pre) => ({ ...pre, quicksaleform: true }))
  }

  const quickSalePayMt = async () => {
    // setQuickSalePay((pre) => ({ ...pre, loading: true }));
    let { date, description, ...paydetails } = quicksalepayForm.getFieldValue()
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    let billId = deliveryBill.prdata.id

    let newData = {
      ...paydetails,
      collectiontype: 'delivery',
      deliveryid: billId,
      date: formateDate,
      type:'Payment',
      createddate: TimestampJs(),
      description: description === undefined || description === null ? '' : description,
      isdeleted:false
    }

    let balanceAmount = deliveryBill.data.billamount - deliveryBill.data.partialamount
    let newPayAmount = balanceAmount - newData.amount

    if (paydetails.amount === 0) {
      message.open({ type: 'info', content: 'Enter the Valuable Amount' })
      return
    }
    setLoadingSpin((pre) => ({ ...pre, quicksaleform: true }))
    try {
      if (newPayAmount < 0) {
        message.open({ type: 'warning', content: `Give the correct amount` })
      } else {
        if (newPayAmount === 0) {
          // Payed in full
          setPayModalState((pre) => ({ ...pre, btndisable: true }))
          let updateData = { partialamount: 0, paymentstatus: 'Paid', updateddate: TimestampJs() }
          await updateDelivery(deliveryBill.data.id, updateData)
          const DeliveryDocRef = doc(db, 'delivery', billId)
          const payDetailsRef = collection(DeliveryDocRef, 'paydetails')
          await addDoc(payDetailsRef, newData)
          await deliveryUpdateMt()
          // await message.open({ type: 'success', content: `Paid successfully` });
        } else {
          // Partial payment update
          setPayModalState((pre) => ({ ...pre, btndisable: true }))
          let partialamount = {
            partialamount: deliveryBill.data.partialamount + newData.amount,
            paymentstatus:
              deliveryBill.data.paymentstatus === 'Unpaid'
                ? 'Partial'
                : deliveryBill.data.paymentstatus,
            updateddate: TimestampJs()
          }
          await updateDelivery(deliveryBill.data.id, partialamount)
          const DeliveryDocRef = doc(db, 'delivery', billId)
          const payDetailsRef = collection(DeliveryDocRef, 'paydetails')
          await addDoc(payDetailsRef, newData)
          await deliveryUpdateMt()
          // await message.open({ type: 'success', content: `Payment pay successfully` });
        }
      }
    } catch (e) {
      console.log(e)
    } finally {
      // Ensure the delivery update finishes
      setTimeout(async () => {
        let { delivery, status } = await getDeliveryById(deliveryBill.prdata.id)
        // console.log(delivery);

        if (status) {
          setDeliveryBill((pre) => ({
            ...pre,
            update: !deliveryBill.update,
            prdata: delivery,
            returnmodeltable: delivery.type === 'return' ? true : false
          }))
        }
      }, 2000)
      // Wait for the reset of fields and modal closure
      quicksalepayForm.resetFields()
      //  await setQuickSalePay((pre) => ({ ...pre, modal: false, loading: false }));
      await message.open({ type: 'success', content: `Payment pay successfully` })
      setPopupModal((pre) => ({ ...pre, quicksaleform: false }))
      setLoadingSpin((pre) => ({ ...pre, quicksaleform: false }))
      
    }
  }

  // spiner
  const [loadingSpin, setLoadingSpin] = useState({
    payhistory: false,
    quicksaleform: false
  })

  // model open close
  const [popupModal, setPopupModal] = useState({
    payhistory: false,
    quicksaleform: false
  })

  // form pay modal
  const [payModalState, setPayModalState] = useState({
    data: {},
    type: 'create',
    btndisable: false
  })

  const [historyBtn, setHistoryBtn] = useState({
    // modal:false,
    data: []
  })

  // History buttton
  const historyBtnMt = async () => {
    //spiner
    setLoadingSpin((pre) => ({ ...pre, payhistory: true }))
    //modal
    setPopupModal((pre) => ({ ...pre, payhistory: true }))
    // get data
    const { paymenthistory } = await fetchPayDetailsForDelivery(deliveryBill.prdata.id);
    let filterdata = paymenthistory.filter(data => data.isdeleted === false)
console.log(filterdata);

    const sortedHistory = await oldestFirstSort(filterdata)

    let paydetails =
      sortedHistory.length > 0
        ? filterdata.map((data, i) => ({
            key: data.id,
            label: data.date,
            children: (
              <span className="flex gap-x-1 w-full ">
                {' '}
                <Tag className="m-0" color="green">
                  {formatToRupee(data.amount)}
                </Tag>{' '}
                <Tag className="m-0">{data.paymentmode}</Tag> {data.description}
                {/* <MdOutlineModeEditOutline 
      onClick={()=>{
        // click to get the data 
        setPayModalState(pre=>({...pre,data:data,type:'edit',btndisable:false})); 
        // modal open
        setPopupModal(pre=>({...pre,quicksaleform:true})); 
        // update the old data in the form
        quicksalepayForm.setFieldsValue({amount:data.amount,date:dayjs(data.date, 'DD/MM/YYYY') ,description:data.description}); 
        }} 
        size={17} className='text-blue-500 cursor-pointer'/>  */}
              </span>
            ),
            date: data.createddate
          }))
        : []

    // paid
    if (deliveryBill.prdata.paymentstatus === 'Paid') {
      setHistoryBtn((pre) => ({
        ...pre,
        data: [
          ...paydetails,
          {
            dot: <MdOutlineDoneOutline className="timeline-clock-icon text-green-500 pb-0" />,
            label: 'Paid',
            children: ( <span className="pb-0 mb-0">{`${deliveryBill.data.billamount === undefined ? 0 : formatToRupee(deliveryBill.data.billamount)}`}</span>)
          }
        ]
      }))
    }
    // unpaid
    else if (deliveryBill.prdata.paymentstatus === 'Unpaid') {
      setHistoryBtn((pre) => ({
        ...pre,
        data: [
          ...paydetails,
          {
            dot: <GiCancel className="timeline-clock-icon text-red-500" />,
            label: 'Unpaid',
            children: ` ${deliveryBill.data.billamount === undefined ? 0 : formatToRupee(deliveryBill.data.billamount)}`
          }
        ]
      }))
    }
    // partial
    else if (deliveryBill.prdata.paymentstatus === 'Partial') {
      let isPartial =
        sortedHistory.length > 0
          ? undefined
          : {
              label: 'Partial',
              children: ` ${deliveryBill.data.partialamount === 0 ? '' : formatToRupee(deliveryBill.data.partialamount)}`
            }
      setHistoryBtn((pre) => ({ ...pre, data: [...paydetails, isPartial] }))
    }

    setLoadingSpin((pre) => ({ ...pre, payhistory: false }))
  }

  const updateQuickSalePayMt = async () => {
    let { date, amount, description } = quicksalepayForm.getFieldValue()
    let oldAmount = payModalState.data.amount
    let partialAmount = deliveryBill.data.partialamount
    let billingAmount = deliveryBill.data.billamount
    if (
      payModalState.data.date === dayjs(date).format('DD/MM/YYYY') &&
      payModalState.data.amount === amount &&
      payModalState.data.description === description.trim()
    ) {
      message.open({ type: 'info', content: 'No changes made' })
    } else {
      //loading modal
      // setPayModalState(pre=>({...pre,btndisable:true}));
      // setLoadingSpin(pre=>({...pre,quicksaleform:true}))
      let updatePayData = {
        date: dayjs(date).format('DD/MM/YYYY'),
        amount: amount,
        description: description,
        updateddate: TimestampJs()
      }
      let payIdChild = payModalState.data.id
      let PayId = deliveryBill.data.id
      let lessAmount = partialAmount - oldAmount
      //  console.log(billingAmount,lessAmount);
      //  await updatePaydetailsChild(PayId,payIdChild,updatePayData);
      //  await historyBtnMt();
      //  setPopupModal(pre=>({...pre,quicksaleform:false}));
      //  //loading modal stop
      //  setLoadingSpin(pre=>({...pre,quicksaleform:false}))
    }
  }

  const pdfBillStyle = {heading:'28px',subheading:'26px',para:'22px'};

  const temTableHeight = TableHeight(200,430);
  const returnTableHeight = TableHeight(200,430);
  return (
    <div>
      <Modal
        width={300}
        centered={true}
        title={
          <span className="flex gap-x-1 justify-center items-center">
            <PiWarningCircleFill className="text-yellow-500 text-xl" /> Warning
          </span>
        }
        open={isCloseWarning}
        zIndex={1001}
        onOk={warningModalOk}
        onCancel={() => {
          setIsCloseWarning(false)
        }}
        okText="ok"
        cancelText="Cancel"
        className="center-buttons-modal"
      >
        <p className="text-center">Are your sure to Cancel</p>
      </Modal>

      <div
        ref={printRef}
        className="absolute top-[-200rem] w-full"
        // className="w-full"
        // style={{ padding: '20px', backgroundColor: '#ffff' }}
      >
        <section className="w-[90%] mx-auto mt-1">
          <ul className="flex justify-center items-center gap-x-5">
            <li>
              <img className="w-[68px]" src={companyLogo} alt="comapanylogo" />{' '}
            </li>
            <li className="text-center">
              <h1 style={{fontSize:`${pdfBillStyle.heading}`}} className='font-bold'>NEW SARANYA ICE COMPANY</h1>{' '}
             <div style={{fontSize:`${pdfBillStyle.subheading}`}}>
             <p >PILAVILAI, AZHAGANPARAI P.O.</p> <p >K.K.DIST</p>
             </div>
            </li>
          </ul>

          <ul style={{fontSize:`${pdfBillStyle.para}`}} className="mt-1 flex justify-between">
            <li>
              <div>
                <span className="font-bold">Date:</span>{' '}
                <span>
                  {Object.keys(invoiceDatas.customerdetails).length !== 0
                    ? invoiceDatas.customerdetails.date
                    : null}
                </span>
                {' '}
              </div>
              <div>
                <span className="font-bold">GSTIN:</span> 33AAIFN6367K1ZV
              </div>
              <div>
                <span className="font-bold">Name:</span>{' '}
                <span>
                  {Object.keys(invoiceDatas.customerdetails).length !== 0
                    ? invoiceDatas.customerdetails.customername
                    : null}
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

              <div>
              <span className="font-bold">Mobile Number : </span>{' '}
              <span>{invoiceDatas.customerdetails.mobilenumber}</span>
              </div>

              <section className={`${gstin === true ? 'block' : 'hidden'}`}>
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
              </section>

            </li>

            <li className="text-end flex flex-col items-end">
              <span>
                {' '}
                <span className="font-bold">Cell:</span> 7373674757
              </span>
              <span>9487369569</span>
            </li>
          </ul>

          <h2 className={`${invoiceDatas.customerdetails.type === 'return' ? 'block': 'hidden'} font-bold w-full text-center mt-[10px]`} style={{fontSize:`${pdfBillStyle.para}`}}>Return</h2>
          {/* <h1 className="font-bold  text-center text-lg">Invoice</h1> */}
          <table style={{fontSize:`${pdfBillStyle.para}`}} className="billtable min-w-full border-collapse mt-4">
            <thead>
              <tr>
                <th className=" text-left border-b pb-2">S.No</th>
                <th className=" border-b text-left pb-2">Product</th>
                {/* <th className=" border-b text-left pb-2">Flavour</th> */}
                {/* <th className=" border-b text-left pb-2">Size</th> */}
                <th className=" border-b text-left pb-2">Rate</th>
                <th className=" border-b text-left pb-2">Qty</th>
                <th className=" border-b text-left pb-2">MRP</th>
                <th className=" border-b text-left pb-2">Margin</th>
                <th className=" border-b text-left pb-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoiceDatas.data.length > 0
                ? invoiceDatas.data.map((item, i) => (
                    <tr key={i}>
                      <td className=" border-b  pb-2">{item.sno}</td>
                      <td className=" border-b  pb-2">{item.productname} {invoiceDatas.customerdetails.type === 'return' && (item.returntype !== undefined || item.returntype !== null) ? `(${item.returntype})` : '' }</td>
                      {/* <td className=" border-b  pb-2">{item.flavour}</td> */}
                      {/* <td className=" border-b  pb-2">{item.quantity}</td> */}
                      <td className=" border-b  pb-2">{item.pieceamount}</td>
                      <td className=" border-b  pb-2">{item.numberofpacks}</td>
                      <td className=" border-b  pb-2">{item.producttotalamount}</td>
                      <td className=" border-b  pb-2">{toDigit(item.margin)}%</td>
                      <td className=" border-b  pb-2">
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
          
          <div style={{fontSize:`${pdfBillStyle.para}`}}>
          <p className="text-end mt-2 ">
            Total Amount:{' '}
            <span className=" font-bold">
              {Object.keys(invoiceDatas.customerdetails).length !== 0
                ? formatToRupee(invoiceDatas.customerdetails.total)
                : null}
            </span>{' '}
          </p>
          <p className="text-end ">
          Bill Amount:{' '}
            <span className=" font-bold">
              {Object.keys(invoiceDatas.customerdetails).length !== 0
                ? formatToRupee(invoiceDatas.customerdetails.billamount)
                : null}
            </span>
          </p>
          <p
            className={` ${invoiceDatas.customerdetails.partialamount !== 0 || invoiceDatas.customerdetails.paymentstatus === "Paid" ? 'block text-end' : 'hidden'}`}
          >
            Paid Amount:{' '}
            <span className=" font-bold ">
              {Object.keys(invoiceDatas.customerdetails).length !== 0
                ? invoiceDatas.customerdetails.paymentstatus === "Paid"
                ? formatToRupee(invoiceDatas.customerdetails.billamount)
                : formatToRupee(invoiceDatas.customerdetails.partialamount)
                : null}
            </span>
          </p>
          </div>
        
         <div style={{fontSize:`${pdfBillStyle.para}`}} className='flex justify-between items-center'>
         <p className="text-end ">Authorised Signature</p>

<p
  className={` ${invoiceDatas.customerdetails.partialamount !== 0 ? 'block text-end' : 'hidden'}`}
>
  Balance:{' '}
  <span className=" font-bold ">
    {Object.keys(invoiceDatas.customerdetails).length !== 0
      ? formatToRupee(invoiceDatas.customerdetails.billamount - invoiceDatas.customerdetails.partialamount)
      : null}
  </span>
</p>
         </div>
          {/* <p className="text-end mt-28 p-2 ">Authorised Signature</p> */}
        </section>
      </div>

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
            <RangePicker
              format="DD/MM/YYYY"
              className="w-[16rem]"
              onChange={(dates) => setDateRange(dates)}
            />
            <Button onClick={exportPDF} disabled={selectedRowKeys.length === 0}>
              Report <TbReportAnalytics />
            </Button>
            <Button onClick={exportExcel} disabled={selectedRowKeys.length === 0}>
              Export <PiExport />
            </Button>
            <Button
              onClick={() => {
                setIsModalOpen(true)
                setReturnDelivery((pre) => ({ ...pre, state: true }))
                form.resetFields()
              }}
              type="primary"
              disabled={editingKey !== ''}
            >
              {' '}
              Return <IoMdRemove />{' '}
            </Button>
            <Button
              disabled={editingKey !== ''}
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                setReturnDelivery((pre) => ({ ...pre, state: false }))
                setFreezerBoxState(true)
                form4.resetFields(['partialamount'])
                form.resetFields()
                setProductCount(0)
              }}
            >
              Place Order <IoMdAdd />
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
              loading={tableLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
              onScroll={handleTableScroll}
            />
          </Form>
        </li>
      </ul>

      <Modal
        maskClosable={option.tempproduct.length > 0 ? false : true}
        centered
        className="relative"
        title={
          <div className="flex justify-center py-3">
            <h2>{returnDelivery.state === true ? 'RETURN' : 'PLACE ORDER'}</h2>
          </div>
        }
        width={1100}
        open={isModalOpen}
        // onOk={addNewDelivery}
        onCancel={modelCancel}
        okButtonProps={{ disabled: true }}
        footer={
          <div>
            <section className="flex gap-x-3 justify-between ">
              {/* <span className={`${returnDelivery.state === true ? 'invisible' : ''}`}> */}
              <Form
                className="flex gap-x-1"
                disabled={option.tempproduct.length > 0 && !isDeliverySpiner ? false : true}
                form={form5}
                onFinish={onPriceChange}
              >
                <Form.Item name="marginvalue" rules={[{ required: true, message: false }]}>
                  <InputNumber
                    min={0}
                    max={100}
                    type="number"
                    className="w-[11.5rem]"
                    prefix={<span>Margin(%)</span>}
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    Enter
                  </Button>
                </Form.Item>
              </Form>
              {/* </span> */}

              <Form
                className={`${returnDelivery.state === true ? 'hidden' : ''}`}
                disabled={option.tempproduct.length === 0 || isDeliverySpiner ? true : false}
                form={form4}
                initialValues={{
                  partialamount: null,
                  price: 'Price',
                  paymentstatus: 'Paid',
                  paymentmode: 'Cash'
                }}
                onFinish={addNewDelivery}
              >
                <span className="flex gap-x-3 m-0 justify-center items-center">
                  <Form.Item name="paymentstatus">
                    <Radio.Group
                      disabled={option.tempproduct.length === 0 || isDeliverySpiner ? true : false}
                      buttonStyle="solid"
                      onChange={radioOnchange}
                    >
                      <Radio.Button value="Paid">PAID</Radio.Button>
                      <Radio.Button value="Unpaid">UNPAID</Radio.Button>
                      <Radio.Button value="Partial">PARTIAL</Radio.Button>
                    </Radio.Group>
                  </Form.Item>

                  {marginValue.paymentstaus !== 'Unpaid' && (
                    <Form.Item
                      className="mb-0 absolute top-[2rem] left-44"
                      name="paymentmode"
                      rules={[{ required: true, message: 'Please select a payment method' }]}
                    >
                      <Radio.Group disabled={option.tempproduct.length <= 0 ? true : false}>
                        <Radio value="Cash">Cash</Radio>
                        <Radio value="Card">Card</Radio>
                        <Radio value="UPI">UPI</Radio>
                      </Radio.Group>
                    </Form.Item>
                  )}

                  <Form.Item
                    name="partialamount"
                    rules={[
                      {
                        required: marginValue.paymentstaus === 'Partial' ? true : false,
                        message: false
                      }
                    ]}
                  >
                    <InputNumber
                      type="number"
                      min={0}
                      ref={partialAmountRef}
                      disabled={marginValue.paymentstaus === 'Partial' ? false : true}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button htmlType="submit" type="primary" className=" w-fit">
                      ORDER
                    </Button>
                  </Form.Item>
                </span>
              </Form>

              <Form
                className={`${returnDelivery.state === true ? '' : 'hidden'}`}
                disabled={option.tempproduct.length <= 0 || isDeliverySpiner ? true : false}
                form={form4}
                initialValues={{ price: 'Price', paymentstatus: 'Paid' }}
                onFinish={addNewDelivery}
              >
                <span className="flex gap-x-3 m-0 justify-center items-center">
                  <Form.Item name="paymentstatus">
                    <Radio.Group
                      className={`${returnDelivery.state === true ? 'hidden' : 'block'}`}
                      disabled={option.tempproduct.length <= 0 ? true : false}
                      buttonStyle="solid"
                      onChange={radioOnchange}
                    >
                      <Radio.Button value="Paid">PAID</Radio.Button>
                      <Radio.Button value="Unpaid">UNPAID</Radio.Button>
                      <Radio.Button value="Partial">PARTIAL</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item name="partialamount">
                    <InputNumber
                      className={`${returnDelivery.state === true ? 'hidden' : 'block'}`}
                      disabled={marginValue.paymentstaus === 'Partial' ? false : true}
                      type="number"
                      min={0}
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button htmlType="submit" type="primary" className=" w-fit">
                      {returnDelivery.state === true ? 'RETURN' : 'ORDER'}
                    </Button>
                  </Form.Item>
                </span>
              </Form>
            </section>
          </div>
        }
      >
        <Spin spinning={isDeliverySpiner}>
          <div className="grid grid-cols-4 gap-x-3">
            <span className="col-span-1">
              <Form
              className='relative'
                onFinish={createTemDeliveryMt}
                form={form2}
                layout="vertical"
                initialValues={{ date: dayjs(), returntype: 'normal' }}
              >
                <Form.Item
                  className="mb-3 absolute top-[-2.7rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker
                    className="w-[8.5rem]"
                    onChange={(value, i) => sendDeliveryDateOnchange(value, i)}
                    format={'DD/MM/YYYY'}
                  />
                </Form.Item>
                <span className="flex justify-between items-end gap-x-1">
                  <Form.Item
                    className="mb-1 w-full"
                    name="customername"
                    label="Customer Name"
                    rules={[{ required: true, message: false }]}
                  >
                    <Select
                      autoFocus
                      ref={customerRef}
                      showSearch
                      placeholder="Select the Customer"
                      optionFilterProp="label"
                      filterSort={(optionA, optionB) =>
                        (optionA?.label ?? '')
                          .toLowerCase()
                          .localeCompare((optionB?.label ?? '').toLowerCase())
                      }
                      options={option.customer}
                      onChange={(value, i) => customerOnchange(value, i)}
                    />
                  </Form.Item>
                  <Popconfirm
                    title={
                      <span className="flex justify-between items-center gap-x-1">
                        <MdAddShoppingCart size={18} color="#f26724" /> Last order?
                      </span>
                    }
                    icon=""
                    onConfirm={lastOrderBtn}
                  >
                    <Button
                      type="primary"
                      disabled={lastOrderBtnState}
                      className={`${returnDelivery.state ? 'hidden' : 'block'} mb-1`}
                    >
                      <TbFileSymlink />
                    </Button>
                  </Popconfirm>
                </span>

                <Form.Item
                  className={`mb-1 
                  
                  `
                  // ${returnDelivery.state ? 'hidden' : 'block'}
                  }
                  name="boxnumber"
                  label="Box Number"
                  // rules={[{ required: true, message: false }]}
                >
                  <Select
                    allowClear
                    disabled={freezerBoxState}
                    showSearch
                    placeholder="Select the Box"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.freezerboxs}
                    // onChange={(value, i) => productOnchange(value, i)}
                  />
                </Form.Item>

               <span className={`${returnDelivery.state === true ? 'hidden': 'inline-block'} absolute left-1/2 top-1/2 translate-x-2 translate-y-12`}>  <Tag className='w-full flex gap-x-0 justify-between items-center' color={`${productCount <= 0 ? 'red' : 'green'}`}  ><PiGarageBold size={16} /> {productCount <= 0 ? 0 : productCount} </Tag></span>
                
                <Form.Item
                  className="mb-1"
                  name="productname"
                  label="Product Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                  
                    disabled={option.customerstatus}
                    showSearch
                    placeholder="Select the Product"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={option.product}
                    onChange={(value, i) => productOnchange(value, i)}
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
                  className="mb-1 w-full"
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
                  className={`mb-1 w-full text-[0.7rem] ${returnDelivery.state === true ? 'block' : 'hidden'}`}
                  name="returntype"
                  label="Return Type"
                  rules={[
                    { required: returnDelivery.state === true ? true : false, message: false }
                  ]}
                >
                  <Segmented
                    block
                    size="middle"
                    options={[
                      { label: 'Normal', value: 'normal' },
                      { label: 'Damage', value: 'damage' }
                    ]}
                  />
                </Form.Item>



                <Form.Item
                  className="mb-3"
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

                <Form.Item className="mb-3 w-full">
                  <Button className="w-full" type="primary" htmlType="submit">
                    Add To List
                  </Button>
                </Form.Item>
              </Form>
            </span>
            <span className="col-span-3 relative">
              <Form form={temform} onFinish={tempSingleMargin}>
                <Table
                  virtual
                  className="w-full"
                  components={{ body: { cell: EditableCellTem } }}
                  columns={tempMergedColumns}
                  dataSource={option.tempproduct}
                  // pagination={{ pageSize: 5 }}
                  pagination={false}
                  scroll={{ x: false, y: returnDelivery.state === true ? returnTableHeight : temTableHeight }}
                />
              </Form>
            </span>
          </div>

          <span
            className={`absolute top-[-2.7rem] right-10 ${marginValue.amount === 0 ? 'hidden' : 'block'}`}
          >
            <Tag color="blue">
              MRP Amount: <span className="text-sm">{formatToRupee(totalamount)}</span>
            </Tag>
            <Tag
              color="green"
              // className={`${returnDelivery.state === true ? 'hidden' : 'inline-block'}`}
            >
              Net Amount: <span className="text-sm">{formatToRupee(marginValue.amount)}</span>
            </Tag>
          </span>
        </Spin>
      </Modal>

      <Modal
        centered
        className="relative"
        width={1200}
        title={
          <div className="relative flex items-center justify-center text-sm py-2">
            
            <div className="absolute left-10 m-0 text-sm">
            <Tag color="blue" >
              {deliveryBill.data.customername}
            </Tag>
            { deliveryBill.boxnumber === '' ? '' : <Tag color='pink'>{deliveryBill.boxnumber}</Tag>}
            </div>

            <span className="flex gap-x-1">
              {/* <Tag color='blue' className=' m-0'>{deliveryBill.data.customername}</Tag> */}
              <span>
                {deliveryBill.prdata.type === 'order'
                  ? 'DELIVERED'
                  : deliveryBill.prdata.type === 'return'
                    ? 'RETURN'
                    : deliveryBill.prdata.type === 'quick'
                      ? 'QUICK SALE'
                      : 'BOOKING'}{' '}
                ON{' '}
              </span>
              <span
                className={`${deliveryBill.prdata.type === 'booking' ? ' inline-block text-gray-600' : 'hidden'}`}
              >
                {deliveryBill.prdata.deliverydate} {deliveryBill.prdata.time}
              </span>
              <span className={`${deliveryBill.prdata.type !== 'booking' ? ' inline-block' : 'hidden'}`}>
                {deliveryBill.data.date === undefined ? 0 : deliveryBill.data.date}</span>
              <Tag
                className="m-0"
                color={`${deliveryBill.data.paymentstatus === 'Paid' ? 'green' : deliveryBill.data.paymentstatus === 'Unpaid' ? 'red' : deliveryBill.data.paymentstatus === 'Partial' ? 'yellow' : 'blue'}`}
              >
                {deliveryBill.data.paymentstatus}
              </Tag>
              <Tag
                color="green"
                className={`${deliveryBill.data.paymentmode === '' || deliveryBill.data.paymentmode === undefined ? 'hidden' : 'block'}`}
              >
                {deliveryBill.data.paymentmode}
              </Tag>
              <Tag
                color={`${deliveryBill.data.bookingstatus === 'Cancelled' ? 'red' : 'green'}`}
                className={`${deliveryBill.data.bookingstatus === undefined || deliveryBill.data.bookingstatus === null || deliveryBill.data.bookingstatus === '' ? 'hidden' : 'block'}`}
              >
                {deliveryBill.data.bookingstatus === undefined ||
                deliveryBill.data.bookingstatus === null
                  ? ''
                  : deliveryBill.data.bookingstatus}
              </Tag>
            </span>

            <span className="absolute right-10 flex gap-x-2">
              <Popconfirm
                title="Are you sure?"
                onConfirm={async () => {
                  try {
                    setDeliveryBill((pre) => ({ ...pre, loading: true }))
                    await updateDelivery(deliveryBill.data.id, { bookingstatus: 'Delivered' })

                    let { items, status } = await fetchItemsForDelivery(deliveryBill.data.id)
                      items.map(async (data) => {
                        const existingProduct = datas.storage.find(
                          (storageItem) =>
                            storageItem.productid === data.id && storageItem.category === 'Product List'
                        )
                        await updateStorage(existingProduct.id, {
                          numberofpacks: existingProduct.numberofpacks - data.numberofpacks,
                          updateddate: TimestampJs()
                        })
                      })
                      await storageUpdateMt()

                    // await setDeliveryBill(pre=>({...pre,loading:false}));
                    await deliveryUpdateMt()
                  } catch (e) {
                    console.log(e)
                  } finally {
                    setTimeout(async () => {
                      let { delivery, status } = await getDeliveryById(deliveryBill.data.id)
                      // console.log(delivery);

                      if (status) {
                        setDeliveryBill((pre) => ({
                          ...pre,
                          update: !deliveryBill.update,
                          prdata: delivery,
                          returnmodeltable: delivery.type === 'return' ? true : false
                        }))
                      }
                    }, 2000)
                    await message.open({ type: 'success', content: `Delivered successfully` })
                  }
                  // await setUpdateDeliveryState(!updateDeliveryState);
                }}
              >
                <Button
                  type="primary"
                  className={`text-xs ${deliveryBill.data.bookingstatus === undefined || deliveryBill.data.bookingstatus === null || deliveryBill.data.bookingstatus === 'Delivered' || deliveryBill.data.bookingstatus === 'Cancelled' ? 'hidden' : 'block'}`}
                >
                  Delivered
                </Button>
              </Popconfirm>
              {/* Cancelled */}
              <Popconfirm
                title="Are you sure?"
                onConfirm={async () => {
                  try {
                    setDeliveryBill((pre) => ({ ...pre, loading: true }))
                    await updateDelivery(deliveryBill.data.id, { bookingstatus: 'Cancelled' })
                    // await setDeliveryBill(pre=>({...pre,loading:false}));
                    await deliveryUpdateMt()
                  } catch (e) {
                    console.log(e)
                  } finally {
                    setTimeout(async () => {
                      let { delivery, status } = await getDeliveryById(deliveryBill.data.id)
                      // console.log(delivery);

                      if (status) {
                        setDeliveryBill((pre) => ({
                          ...pre,
                          update: !deliveryBill.update,
                          prdata: delivery,
                          returnmodeltable: delivery.type === 'return' ? true : false
                        }))
                      }
                    }, 2000)
                    await message.open({ type: 'success', content: `Cancelled successfully` })
                  }
                }}
              >
                <Button
                  className={`text-xs ${deliveryBill.data.bookingstatus === undefined || deliveryBill.data.bookingstatus === null || deliveryBill.data.bookingstatus === 'Delivered' || deliveryBill.data.bookingstatus === 'Cancelled' ? 'hidden' : 'block'}`}
                >
                  Cancelled
                </Button>
              </Popconfirm>
              <Button
                onClick={historyBtnMt}
                className={`${deliveryBill.data.paymentstatus === 'Return' ? 'hidden' : ''}`}
              >
                <RiHistoryLine />
              </Button>
            </span>
          </div>
        }
        footer={false}
        open={deliveryBill.model}
        onCancel={() => setDeliveryBill((pre) => ({ ...pre, model: false }))}
      >
        <Table
          virtual
          columns={deliveryColumns}
          dataSource={deliveryBill.data?.items?.sort((a, b) => a.sno - b.sno) || []}
          loading={deliveryBill.loading}
          pagination={false}
          scroll={{ x: 200, y: historyHeight }}
        />

        <div className="mt-5">
          <span>
            Total Amount:
            <Tag className="text-[1.1rem]" color="blue">
              {formatToRupee(deliveryBill.data.total === undefined ? 0 : deliveryBill.data.total)}
            </Tag>
          </span>

          <span
          // className={`${deliveryBill.returnmodeltable === true ? 'hidden' : 'inline-block'}`}
          >
            Billing Amount:
            <Tag className="text-[1.1rem]" color="green">
              {formatToRupee(
                deliveryBill.data.billamount === undefined ? 0 : deliveryBill.data.billamount
              )}
            </Tag>
          </span>

          <span className={`${deliveryBill.data.partialamount === 0 ? 'hidden' : 'inline-block'}`}>
            Partial Amount:
            <Tag className="text-[1.1rem]" color="yellow">
              {formatToRupee(
                deliveryBill.data.total === undefined ? 0 : deliveryBill.data.partialamount
              )}
            </Tag>
          </span>

          <span
            className={`${deliveryBill.prdata.paymentstatus === 'Paid' || deliveryBill.prdata.paymentstatus === 'Return' ? 'hidden' : 'inline-block'}`}
          >
            Balance Amount:{' '}
            <Tag color="red" className="text-sm font-medium">
              {formatToRupee(deliveryBill.data.billamount - deliveryBill.data.partialamount)}
            </Tag>
          </span>
        </div>

        <div
          className={`${deliveryBill.prdata.paymentstatus === 'Paid' || deliveryBill.prdata.type === 'order' || deliveryBill.prdata.type === 'return' ? 'hidden' : 'block'}`}
        >
          <div className="w-full flex items-center justify-end">
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              onClick={openQuickSaleModalMt}
              type="primary"
              disabled={loadingSpin.quicksaleform || loadingSpin.payhistory || isDeliverySpiner}
              // disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
            >
              Pay
              <MdOutlinePayments />
            </Button>
          </div>

          <Modal
            okText={payModalState.type === 'create' ? 'Pay' : 'Update'}
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
                <h1>PAY</h1>{' '}
              </div>
            }
            open={popupModal.quicksaleform}
            onCancel={() => {
              setPopupModal((pre) => ({ ...pre, quicksaleform: false }))
              quicksalepayForm.resetFields()
              // if (
              //   customerOnchange.payamount === '' ||
              //   customerOnchange.payamount === undefined ||
              //   customerOnchange.payamount === null
              // ) {
              //   setIsPayModelOpen(false)
              // } else {
              //   setIsCloseWarning(true)
              // }
            }}
            // onOk={() => {
            //   quicksalepayForm.submit();
            // }}
            okButtonProps={{ disabled: payModalState.btndisable }}
            footer={
              <div className="flex justify-end gap-x-2 items-center">
                <Button
                  onClick={() => {
                    setPopupModal((pre) => ({ ...pre, quicksaleform: false }))
                    quicksalepayForm.resetFields()
                    // if (
                    //   customerOnchange.payamount === '' ||
                    //   customerOnchange.payamount === undefined ||
                    //   customerOnchange.payamount === null
                    // ) {
                    //   setIsPayModelOpen(false)
                    // } else {
                    //   setIsCloseWarning(true)
                    // }
                  }}
                >
                  Cancel
                </Button>

                <Popconfirm
                  title="Are you sure?"
                  //description={<>because the 'PAYMENT HISTORY' can't be edited?</>}
                  onConfirm={() => quicksalepayForm.submit()}
                >
                  <Button disabled={payModalState.btndisable} type="primary">
                    Pay
                  </Button>
                </Popconfirm>
              </div>
            }
          >
            <Spin spinning={loadingSpin.quicksaleform}>
              <Form
                onFinish={payModalState.type === 'create' ? quickSalePayMt : updateQuickSalePayMt}
                form={quicksalepayForm}
                initialValues={{ date: dayjs(), paymentmode: 'Cash' }}
                layout="vertical">
                <Form.Item
                  className=" absolute top-[-3rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
                </Form.Item>
                <Form.Item
                  className="mb-1"
                  name="amount"
                  label="Amount"
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber
                    onChange={
                      (e) => {} // customerOnchangeMt(e, 'payamount')
                    }
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
        </div>
      </Modal>

      {/* payment history model */}
      <Modal
        footer={null}
        centered
        onCancel={() => setPopupModal((pre) => ({ ...pre, payhistory: false }))}
        open={popupModal.payhistory}
      >
        <h2 className="w-full text-center font-bold mb-5"> PAYMENT HISTORY</h2>
        <Spin spinning={loadingSpin.payhistory}>
          <Timeline mode="left" items={historyBtn.data} />
        </Spin>
      </Modal>

      {/* new start */}
      <div
        ref={GstBillRef}
        className="absolute top-[-200rem] w-full"
        style={{ padding: '20px', backgroundColor: '#ffff', fontSize: '16px'}}
      >
        <span
          className="w-full block text-center font-bold text-[20px]"
        >
          TAX INVOICE
        </span>
        <div className="w-full flex justify-center items-center">
          <section className="w-[90%] border mt-4">
            <ul
              className={`px-2 flex justify-between text-[16px]`}
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
              <li className="text-center pb-2">
                <p
                  className="font-bold text-[14px]"
                >
                  NEW SARANYA ICE COMPANY
                </p>{' '}
              </li>
            </ul>

            {/* grid -2 */}
            <ul className={`px-2 pb-2`}>
              <li className='text-[16px]'>
                <span className="text-center block ">
                Factory Address : TC48/285, Pilavilai, Azhaganparai, Kanyakumari Dist, Pincode-629501
                </span>
              </li>
            </ul>

            <ul className={`px-2 border-t pb-2`}>
              <li className='text-[16px]'>
                <span className="text-center block ">
                Regd Office : 28/3030,Pilavilai,Azhaganparai,K.K.Dist-629501
                </span>
              </li>
            </ul>

            <table className="gsttable w-full">
              <thead>
                <tr>
                  <th
                    className={`pl-2 font-medium text-[16px] pb-2`}
                  >
                    <span className="text-left block ">
                      GSTIN
                      &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;:
                      33AAIFN6367K1ZV
                    </span>
                    <span className="text-left block ">
                      PAN No &#160;&#160;&#160;&#160;&#160;&#160;:{' '}
                      <span className="font-medium">33AAIFN6367K1ZV</span>
                    </span>
                  </th>

                  <th
                    className={`font-medium text-[16px] pb-2`}
                  >
                    <span className="block">FSSAI No</span>
                    33AAIFN6367K1ZV
                  </th>

                  <th
                    className={`font-medium text-[16px] pb-2`}
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
              <li className={`border-r pb-2`}>
                <div className="px-2">
                  <span
                    className="text-left block font-semibold text-[16px]"
                  >
                    Billed To{' '}
                  </span>
                  <address
                    className={`not-italic text-[16px]`}
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
                    className={` font-medium mt-3 block text-[16px]`}
                  >
                    PAN NO &#160;&#160;&#160;&#160;&#160;&#160;&#160;: 33AAIFN6367K1ZV<br />
                    GSTIN &#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;&#160;: 33AAIFN6367K1ZV
                    <br />
                  </span>
                </div>
              </li>
              {/* shipped address */}
              <li className='text-[16px] pb-2'>
                <div className="px-2 flex flex-col justify-between">
                  <span className="text-left block font-semibold">Shipped To </span>
                  <address
                    className={`not-italic text-[16px]`}
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
                    className={` font-medium  block text-[16px]`}
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
              minHeight: '46rem',
              overflowY: 'auto',
              pageBreakInside: 'avoid'
            }}
            >
              <table
                className={`gstitemtable min-w-full border-collapse text-[16px]`}
              >
                <thead>
                  <tr>
                    <th
                      className={`border-r w-[2rem] text-[16px] pb-2`}
                    >
                      S.No
                    </th>
                    <th
                      className={` border-b text-[16px] pb-2`}
                    >
                      Product
                    </th>
                    <th
                      className={` border-b text-[16px] pb-2`}
                    >
                      Rate
                    </th>
                    <th
                      className={` border-b text-[16px] pb-2`}
                    >
                      Qty
                    </th>
                    <th
                      className={` border-b text-[16px] pb-2`}
                    >
                      MRP
                    </th>
                    <th
                      className={` border-b text-[16px] pb-2`}
                    >
                      Discount
                    </th>
                    <th
                      className={` border-b text-[16px] pb-2`}
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
                            className={`border-b text-center text-[16px] pb-2`}
                          > 
                            {i + 1}
                          </td>
                          <td
                            className={` border-b px-1 text-[16px]`}
                          >
                            {item.productname}{' '}
                            {invoiceDatas.customerdetails.type === 'return' &&
                            (item.returntype !== undefined || item.returntype !== null)
                              ? `(${item.returntype})`
                              : ''}
                          </td>
                          <td
                            className={` border-b text-center text-[16px]`}
                          >
                            {item.pieceamount}
                          </td>
                          <td
                            className={` border-b text-center text-[16px]`}
                          >
                            {item.numberofpacks}
                          </td>
                          <td
                            className={` border-b text-center text-[16px]`}
                          >
                            {item.producttotalamount}
                          </td>
                          <td
                            className={` border-b text-center text-[16px]`}
                          >
                            {toDigit(item.margin)}%
                          </td>
                          <td
                            className={` border-b text-center text-[16px]`}
                          >
                            {customRound(
                              item.numberofpacks * item.pieceamount -
                                (item.numberofpacks * item.pieceamount * item.margin) / 100
                            )}
                          </td>
                        </tr>
                      ))
                    : 'No Data'}

                  <tr className='px-1 pdf-padding'>
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
              className={`gsttaxtable w-full text-[16px] pdf-padding`}
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
                className={`gsttaxtable w-full text-center text-[16px]`}
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
              className={`text-[16px] border-b w-full border-x grid grid-cols-2  `}
            >
                <li className={`border-t border-r pb-2`}>
                <div className="px-2">
                  <span
                    className={`font-medium block text-[16px]`}
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
                    className={` font-medium  block text-[16px]`}
                  >
                    Total Sale Value : <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.total)
                          : null}
                      </span><br />
                    <span>
                      Discount :{' '}<span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.total - invoiceDatas.customerdetails.billamount)
                          : null}
                      </span>
                    </span>
                    <br />
                   
                  </span>
                </div>
              </li> 

              <li className={`px-2 border-t pb-2`}>
                <h2
                  className="w-full font-semibold text-[16px]"
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
                className={`px-2 border-l font-medium text-[16px] text-right`}
              >
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
                <span className="block font-bold pt-5"> Grand Total : <span>
                        {Object.keys(invoiceDatas.customerdetails).length !== 0
                          ? formatToRupee(invoiceDatas.customerdetails.billamount + invoiceDatas.customerdetails.billamount * 0.18)
                          : null}
                      </span></span>
              </li>
              
              <li
                className={`px-2 border-t w-full text-[16px] pb-2`}
              >
                <p className={`font-semibold text-[14px]`}>Declaration & Terms Of Delivery</p>
                <p className='text-[8px]'>1 Billing Is Ex-Works.Claims for Shortage and Defective Goods Will Not Be Entertained After Delivery.</p>
                <p className='text-[8px]'>2 All Transportation Via Buyer Vehicle Is Cost to Buyers Accounts.All Damages/risks After Delivery at Factory Premises to Buyers Accounts</p>
                <p className='text-[8px]'>3 All Taxes/levis/penalites/compounding Fees Etc Imposed Post Delivery to the Buyers Accounts.</p>
                <p className='text-[8px]'>4 Name of the Commodity- IC = Medium fat Ice cream,FD = Medium fat frozen dessert,LG=High fat ice cream,IL=Ice lolly,IN=ice candy</p>
                <p className='text-[8px]'>5 We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
              </li>

              <li
                className={`px-2  border-l border-t text-[16px] pb-2`}
              >
                Checked by <span className='font-semibold'>NEW SARANYA ICE COMPANY</span>
                <span className="block text-right pt-14"> Authorised Signature </span>
              </li>

            </ul>
          </section>
        </div>
      </div>
      {/* new end */}
    </div>
  )
}
