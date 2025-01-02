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
  DatePicker,
  Radio,
  Tag,
  Spin,
  Badge
} from 'antd'
import { debounce } from 'lodash'
import { PiExport, PiGarageBold } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { IoMdRemove } from 'react-icons/io'
import { AiOutlineDelete } from 'react-icons/ai'
import jsonToExcel from '../js-files/json-to-excel'
import {
  createRawmaterial,
  fetchMaterials,
  updateRawmaterial
} from '../firebase/data-tables/rawmaterial'
import { TimestampJs } from '../js-files/time-stamp'
// import { createStorage, getStorage, updateStorage } from '../firebase/data-tables/storage'
import dayjs from 'dayjs'
import {
  getAllMaterialDetailsFromAllSuppliers,
  getMaterialDetailsById,
  getOneMaterialDetailsById
} from '../firebase/data-tables/supplier'
const { Search } = Input
const { RangePicker } = DatePicker
import { PiWarningCircleFill } from 'react-icons/pi'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { addDoc, collection } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { FaClipboardList } from 'react-icons/fa'
import TableHeight from '../components/TableHeight'
import './css/RawMaterial.css'

import { addRawMaterial, updateRawMaterial, addRawMaterialDetail } from '../sql/rawmaterial'
import { getStorages, updateStorage } from '../sql/storage'
import { getSupplierById } from '../sql/supplier'
import { getSupplierAndMaterials, getMaterialsBySupplierId , getMaterialById } from '../sql/supplierandmaterials'

export default function RawMaterial({ datas, rawmaterialUpdateMt, storageUpdateMt }) {
  //states
  const [form] = Form.useForm()
  const [addmaterialaddform] = Form.useForm()
  const [addmaterialpaymentform] = Form.useForm()
  const [addmaterialtemtableform] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState('')
  const [data, setData] = useState([])
  const [selectedSupplierName, setSelectedSupplierName] = useState(null)
  const [materials, setMaterials] = useState([])
  const [dateRange, setDateRange] = useState([null, null])
  const [usedmaterialform] = Form.useForm()
  const [usedMaterialModal, setUsedMaterialModal] = useState(false)
  const [isMaterialTbLoading, setIsMaterialTbLoading] = useState(true)
  const [totalFormAmount, setTotalFormAmount] = useState(0)
  const [isLoadMaterialUsedModal, setIsLoadMaterialUsedModal] = useState(false)
  const [offset, setOffset] = useState(0)
  const chunkSize = 25

  // side effect
  useEffect(() => {
    const fetchData = async () => {
      setIsMaterialTbLoading(true)
      let rawTableDtas = await Promise.all(
        datas.rawmaterials.slice(offset, offset + chunkSize).map(async (data) => ({
          ...data,
          ...(data.supplierId ? await getSupplierById(data.supplierId) : '-')
          //  ...(data.supplierid && data.materialid ? await getOneMaterialDetailsById(data.supplierid,data.materialid): '-')
        }))
      )

      const filteredMaterials = await Promise.all(
        rawTableDtas
          .filter((data) => isWithinRange(data.date))
          .map((item, index) => ({ ...item, key: item.id || index }))
      )
      console.log(filteredMaterials)
      setData((prevData) =>
        offset === 0 ? filteredMaterials : [...prevData, ...filteredMaterials]
      )
      setIsMaterialTbLoading(false)
    }
    fetchData()
  }, [datas.rawmaterials, dateRange, offset])

  useEffect(() => {
    setOffset(0)
    setData([])
  }, [datas.rawmaterials, dateRange])

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

  const [unitOnchange, setUnitOnchange] = useState('')
  // Dropdown select
  useEffect(() => {
    async function process(params) {
      addmaterialaddform.resetFields(['materialName'])
      setUnitOnchange('')
      if (selectedSupplierName) {
        // const filteredMaterials = await datas.suppliers
        //   .filter((supplier) => supplier.id === selectedSupplierName)
        //   .map((supplier) => ({
        //     value: supplier.materialName,
        //     label: supplier.materialName,
        //     key: supplier.id
        //   }));
        console.log(selectedSupplierName)
        const filteredMaterials = await getMaterialsBySupplierId(selectedSupplierName).then(
          (materials) =>
            materials.map((data) => ({
              label: data.name,
              value: data.id,
              key: data.id,
              unit: data.unit
            }))
        )
        setMaterials(filteredMaterials)
        form.resetFields(['materialName', 'quantity', 'unit', 'price', 'paymentStatus'])
      } else {
        setMaterials([])
      }
    }
    process()
  }, [selectedSupplierName, datas.suppliers])

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
    const { scrollTop, scrollHeight, clientHeight } = e.target

    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setOffset((prevOffset) => prevOffset + chunkSize)
    }
  }, 200)

  const [isLoadingModal, setIsLoadingModal] = useState(false)

  const addNewMaterialTempColoumn = [
    {
      title: <span className="text-[0.8rem]">S.No</span>,
      dataIndex: 'sno',
      key: 'sno',
      editable: false,
      render: (text, data, i) => {
        return <span className="text-[0.8rem]">{i + 1}</span>
      },
      width: 60
    },
    {
      title: <span className="text-[0.8rem]">Product</span>,
      dataIndex: 'name',
      key: 'name',
      editable: false,
      render: (text) => <span className="text-[0.8rem]">{text}</span>
    },
    {
      title: <span className="text-[0.8rem]">Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      render: (text, data) => <span className="text-[0.8rem]">{text + ' ' + data.unit}</span>,
      width: 130
    },
    {
      title: <span className="text-[0.8rem]">Price</span>,
      dataIndex: 'price',
      key: 'price',
      editable: true,
      render: (text) => <span className="text-[0.8rem]">{text}</span>,
      width: 150
    },
    {
      title: <span className="text-[0.8rem]">Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        let iseditable = isEditAddMaterialTemp(record)
        return !iseditable ? (
          <span className="flex gap-x-2">
            <MdOutlineModeEditOutline
              className="text-blue-500 cursor-pointer"
              size={19}
              onClick={() => temTbAddMaterialEdit(record)}
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
            <Typography.Link style={{ marginRight: 8 }} onClick={() => tempSave(record)}>
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => setAddMaterialMethod((pre) => ({ ...pre, editingKeys: [] }))}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const materialNameOnchange = debounce((_, value) => {
    addmaterialaddform.resetFields(['quantity', 'price'])
    setUnitOnchange(value.unit)
  }, 300)

  const [addMaterialMethod, setAddMaterialMethod] = useState({
    temperorarydata: [],
    editingKeys: [],
    supplierdata: {}
  })

  const isEditAddMaterialTemp = (re) => {
    return addMaterialMethod.editingKeys.includes(re.id)
  }

  const temTbAddMaterialEdit = (re) => {
    addmaterialtemtableform.setFieldsValue({ ...re })
    setAddMaterialMethod((pre) => ({ ...pre, editingKeys: [re.id] }))
  }

  const tempMergedColumns = addNewMaterialTempColoumn.map((col) => {
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
        editing: isEditAddMaterialTemp(record)
      })
    }
  })

  const TempEditableCell = ({
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
        <InputNumber className="text-[0.8rem]" size="small" />
      ) : (
        <Input className="text-[0.8rem]" size="small" />
      )
    return (
      <td {...restProps}>
        {editing ? (
          <span className="flex gap-x-1">
            <Form.Item
              name={dataIndex}
              style={{ margin: 0 }}
              rules={[{ required: true, message: false }]} // Adjust message or handle error
            >
              {inputNode}
            </Form.Item>
          </span>
        ) : (
          children
        )}
      </td>
    )
  }

  const removeTemProduct = async (data) => {
    const newTempProduct = addMaterialMethod.temperorarydata.filter((item) => item.id !== data.id)
    setAddMaterialMethod((pre) => ({ ...pre, temperorarydata: newTempProduct }))

    const newTotal = newTempProduct.reduce((total, item) => total + Number(item.price), 0)
    setTotalFormAmount(newTotal)
  }

  const tempSave = async (data) => {
    const row = addmaterialtemtableform.getFieldsValue()

    // Check if the values are unchanged
    if (data.quantity === row.quantity && data.price === row.price) {
      setAddMaterialMethod((pre) => ({ ...pre, editingKeys: [] }))
      return message.open({ type: 'info', content: 'No Changes Made' })
    }

    try {
      const updatedData = addMaterialMethod.temperorarydata.map((item) =>
        item.id === data.id
          ? { ...item, quantity: Number(row.quantity), price: Number(row.price) }
          : item
      )
      // Update the specific item in the temporary data array
      setAddMaterialMethod((pre) => ({
        ...pre,
        temperorarydata: pre.temperorarydata.map((item) =>
          item.id === data.id
            ? { ...item, quantity: Number(row.quantity), price: Number(row.price) }
            : item
        ),
        editingKeys: []
      }))

      const newTotal = updatedData.reduce((total, item) => total + Number(item.price), 0)
      setTotalFormAmount(newTotal)
    } catch (e) {
      console.log(e)
    }
  }

  // create the new add material entry
  const AddTemMaterial = async (values) => {
    
    let material = await getMaterialById(values.materialName)
    let exsitingData = addMaterialMethod.temperorarydata.some(
      (data) => data.id === values.materialName
    )
    console.log(values,material)
    // supplier data
    let supplierDatas = {
      supplierid: values.suppliername,
      date: dayjs(values.date).format('DD/MM/YYYY')
    }

    // setAddMaterialMethod(pre=>({...pre,supplierdata:supplierDatas}));

    if (exsitingData) {
      message.open({ type: 'warning', content: 'Already Exists' })
    } else {
      let compainAddData = { ...material, quantity: values.quantity, price: values.price }
      setAddMaterialMethod((pre) => ({
        ...pre,
        temperorarydata: [...pre.temperorarydata, compainAddData],
        supplierdata: supplierDatas
      }))

      const newTotal = [...addMaterialMethod.temperorarydata, compainAddData].reduce(
        (total, item) => total + Number(item.price),
        0
      )
      setTotalFormAmount(newTotal)
    }

    /*
    setIsLoadingModal(true)
    try {
      if (form.getFieldValue('partialAmount') === '0') {
        return message.open({ type: 'warning', content: 'Please enter a valid amount' })
      } else {
        const { date, materialName, suppliername, ...otherValues } = await values
        const formattedDate = date ? dayjs(date).format('DD/MM/YYYY') : null

        await createRawmaterial({
          supplierid: suppliername,
          materialid: materialName,
          ...otherValues,
          date: formattedDate,
          partialAmount: otherValues.partialAmount || 0,
          createdDate: TimestampJs(),
          isDeleted: false,
          type: 'Added'
        });
         
        const materialData = await getOneMaterialDetailsById (suppliername,materialName)
        
        const existingMaterial = datas.storage.find(
          (storageItem) =>
            storageItem.category === 'Material List' &&
            storageItem.materialName?.trim().toLowerCase() === materialData.material.materialName?.trim().toLowerCase() &&
            storageItem.unit?.trim().toLowerCase() === materialData.material.unit?.trim().toLowerCase()
        );
        if (existingMaterial) {
          await updateStorage(existingMaterial.id, {
            quantity: existingMaterial.quantity + otherValues.quantity
          })
          await storageUpdateMt()
        }

        form.resetFields()
        rawmaterialUpdateMt()
        setIsModalOpen(false)
        setRadioBtn({ status: true, value: '' })
        setSelectedSupplierName(null)
      }
    } catch (error) {
      console.log(error)
    } 
    finally {
      setIsLoadingModal(false)
    }
    */
  }

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        let supplierName = record.name || undefined
        return (
          String(record.date).toLowerCase().includes(value.toLowerCase()) ||
          String(supplierName).toLowerCase().includes(value.toLowerCase()) ||
          String(record.billamount === undefined ? '-' : record.billamount)
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          String(record.partialAmount === undefined ? '-' : record.partialAmount)
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          String(record.paymentMode === undefined ? '-' : record.paymentMode)
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          String(record.type === undefined ? '-' : record.type)
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          String(record.paymentStatus === undefined ? '-' : record.paymentStatus)
            .toLowerCase()
            .includes(value.toLowerCase())
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
      // defaultSortOrder: 'descend',115
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
      width: 115
    },
    {
      title: 'Supplier',
      dataIndex: 'name',
      key: 'name',
      editable: true
      // render:(_,record)=>{
      //  return record.supplier === undefined ? '-' : record.supplier.name
      // }
    },
    {
      title: 'Price',
      dataIndex: 'billAmount',
      key: 'billAmount',
      editable: true,
      width: 120,
      // render:(text)=>{
      //   return text === undefined || text === null || text === '' ? '-' : text
      // }
      render: (text) => {
        return formatToRupee(text, true) === 'NaN' ? '-' : formatToRupee(text, true)
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      editable: false,
      width: 80,
      sorter: (a, b) => a.type.localeCompare(b.type),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text) => (
        <Tag color={text === 'Added' ? 'green' : text === 'Return' ? 'yellow' : 'red'}>{text}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      editable: false,
      width: 140,
      sorter: (a, b) => a.paymentStatus.localeCompare(b.paymentStatus),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text, record) => (
        <span className="flex gap-x-0">
          <Tag color={text === 'Paid' ? 'green' : text === 'Partial' ? 'yellow' : 'red'}>
            {text}{' '}
          </Tag>{' '}
          {text === 'Partial' ? <Tag color="blue">{record.partialAmount}</Tag> : null}
        </span>
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
          <div className="flex gap-x-4 w-full">
            <FaClipboardList
              onClick={editingKey === '' ? () => materialbillbtn(record) : null}
              size={17}
              className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'cursor-pointer text-green-500'}`}
            />

            <span className="flex gap-x-3 justify-center items-center">
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
          </div>
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
            {dataIndex === 'quantity' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="quantity"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber type="number" className="w-full" />
                </Form.Item>
                <Form.Item
                  name="unit"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    showSearch
                    placeholder="Select"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'gm', label: 'GM' },
                      { value: 'mm', label: 'MM' },
                      { value: 'kg', label: 'KG' },
                      { value: 'lt', label: 'LT' },
                      { label: 'Box', value: 'box' },
                      { label: 'Piece', value: 'piece' }
                    ]}
                  />
                </Form.Item>
              </span>
            ) : (
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
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
        inputType:
          col.dataIndex === 'quantity' ||
          col.dataIndex === 'productperpack' ||
          col.dataIndex === 'price'
            ? 'number'
            : 'text',
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
      if (
        index != null &&
        row.flavour === key.flavour &&
        row.productname === key.productname &&
        row.quantity === key.quantity &&
        row.productperpack === key.productperpack &&
        row.price === key.price
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKey('')
      } else {
        await updateRawMaterial(key.id, { ...row })
        rawmaterialUpdateMt()
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
      console.log(selectTableData)
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

  // Table Hight Auto Adjustment (***Do not tounch this code*** ) //
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

  // delete
  const deleteProduct = async (data) => {
    const { id, ...newData } = data
    await updateRawMaterial(id, { isDeleted: 1 })
    rawmaterialUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  const [radioBtn, setRadioBtn] = useState({
    status: true,
    value: '',
    partialAmount: 0
  })

  const radioOnchange = debounce((e) => {
    setRadioBtn((pre) => ({ ...pre, status: false, value: e.target.value }))
    addmaterialpaymentform.setFieldsValue({ partialAmount: 0 })
  }, 300)

  const [materialUsedForm] = Form.useForm()

  // material used
  const usedmaterialcolumns = [
    {
      title: <span className="text-[0.7rem]">S.No</span>,
      editable: false,
      render: (text, record, i) => <span className="text-[0.7rem]">{i + 1}</span>,
      width: 55
    },
    {
      title: <span className="text-[0.7rem]">Material</span>,
      dataIndex: 'materialName',
      key: 'materialName',
      editable: false,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Quantity</span>,
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    {
      title: <span className="text-[0.7rem]">Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        let iseditable = materialUsed.editingKey.includes(record.key)

        return !iseditable ? (
          <div className="flex gap-x-2">
            <MdOutlineModeEditOutline
              className={`text-blue-500 cursor-pointer`}
              size={18}
              onClick={() => {
                materialUsedForm.setFieldsValue({
                  ...record,
                  quantity: Number(record.quantity.split(' ')[0])
                })
                setMaterialUsed((pre) => ({ ...pre, editingKey: [record.key] }))
              }}
            />
            <Popconfirm
              className={`${iseditable === true ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => removeTemMaterial(record)}
              disabled={iseditable === true ? true : false}
            >
              <AiOutlineDelete
                className={`${iseditable === true ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={16}
              />
            </Popconfirm>
          </div>
        ) : (
          <span className="flex gap-x-2">
            <Typography.Link
              style={{ marginRight: 8 }}
              onClick={() => {
                let quantity = materialUsedForm.getFieldsValue().quantity
                let updateData = {
                  ...record,
                  quantity: quantity + ' ' + record.quantity.split(' ')[1]
                }
                setMtOption((pre) => ({
                  ...pre,
                  tempproduct: pre.tempproduct.map((item) =>
                    item.key === updateData.key ? updateData : item
                  )
                }))
                setMaterialUsed((pre) => ({ ...pre, editingKey: [] }))
              }}
            >
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => setMaterialUsed((pre) => ({ ...pre, editingKey: [] }))}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const [materialUsed, setMaterialUsed] = useState({
    editingKey: []
  })

  const materialUsedColumns = usedmaterialcolumns.map((col) => {
    if (!col.editable) {
      return col
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: col.dataIndex === 'quantity' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: materialUsed.editingKey.includes(record.key)
      })
    }
  })

  const materialUsedEditableCell = ({
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
        <InputNumber className="text-[0.8rem]" size="small" />
      ) : (
        <Input className="text-[0.8rem]" size="small" />
      )
    return (
      <td {...restProps}>
        {editing ? (
          <span className="flex gap-x-1">
            <Form.Item
              name={dataIndex}
              style={{ margin: 0 }}
              rules={[{ required: true, message: false }]} // Adjust message or handle error
            >
              {inputNode}
            </Form.Item>
          </span>
        ) : (
          children
        )}
      </td>
    )
  }

  const [mtOption, setMtOption] = useState({
    material: [],
    tempproduct: [],
    count: 0
  })

  const [materialType, setMaterialType] = useState('Used')

  useEffect(() => {
    async function fetchAllMaterial() {
      // const optionsuppliers = datas.suppliers
      // .filter(
      //   (item, i, self) =>
      //     item.isDeleted === false &&
      //     i === self.findIndex((d) => d.materialName === item.materialName)
      // )
      // .map((item) => ({ label: item.materialName, value: item.materialName }))

      //   const optionsuppliersr = await Promise.all(datas.suppliers.map(async data => (await getMaterialDetailsById(data.id))));

      //  let listOfMaterial =  optionsuppliersr.map((supplierDetails, index) => {
      //     const { materials, status } = supplierDetails; // Destructure each supplier's materials and status
      //     return [...materials]
      //   });

      //   let flattenedMaterials = listOfMaterial.flat();

      const allMaterials = await getSupplierAndMaterials()

      const uniqueMaterials = allMaterials
        .filter(
          (material, index, self) =>
            index ===
            self.findIndex(
              (t) =>
                t.name.trim().toLowerCase() === material.name.trim().toLowerCase() &&
                t.unit.trim().toLowerCase() === material.unit.trim().toLowerCase()
            )
        )
        .map((data) => ({ label: data.name, value: data.name, unit: data.unit, key: data.id }))

      setMtOption((pre) => ({ ...pre, material: uniqueMaterials }))
    }
    fetchAllMaterial()
  }, [])

  // create material
  const createUsedMaterial = async (values) => {
    setMtOption((pre) => ({ ...pre, count: pre.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const newMaterial = {
      ...values,
      date: new Date().toISOString(),
      key: mtOption.count,
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      isDeleted: false,
      quantity: values.quantity + ' ' + unitOnchange
    }
    console.log(mtOption.tempproduct, newMaterial)

    const checkExist = mtOption.tempproduct.find(
      (item) => item.materialName === newMaterial.materialName && item.date === newMaterial.date
    )

    if (checkExist) {
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

  const addNewTemMaterial = async () => {
    let i = 1
    setIsLoadMaterialUsedModal(true)
    try {
      let rawMaterialData = mtOption.tempproduct.map((data) => ({
        date: new Date().toISOString(),
        isDeleted: 0,
        type: usedmaterialform.getFieldValue().type,
        paymentStatus: usedmaterialform.getFieldValue().type === 'Return' ? 'Returned' : 'Used',
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString(),
        partialAmount: 0,
        supplierId: 0,
        paymentMode: '',
        billAmount: 0
      }))[0]

      // const supplierDbRef = collection(db, 'rawmaterial');
      // const createSupplierRef = await addDoc(supplierDbRef, { ...materialDetailData });
      // const materialDbRef = collection(createSupplierRef, 'materialdetails');
      console.log(rawMaterialData)
      const rawMaterialRef = await addRawMaterial(rawMaterialData)

      let materials = await getSupplierAndMaterials()

      if (materials) {
        let processedProducts = new Set() // Track processed products

        // Use a for loop to process one by one
        for (let data of mtOption.tempproduct) {
          let matchingMaterial = materials.find(
            (material) =>
              material.name === data.name &&
              material.unit === data.quantity.split(' ')[1] &&
              data.isDeleted === false
          )

          if (matchingMaterial && !processedProducts.has(data.materialName)) {
            processedProducts.add(data.materialName) // Mark as processed

            let materialItem = {
              sno: i++,
              rawMaterial: matchingMaterial.materialId,
              rawMaterialId: rawMaterialRef.id,
              quantity: data.quantity.split(' ')[0],
              isDeleted: 0,
              createdDate: new Date().toISOString(),
              modifiedDate: new Date().toISOString()
            }

            // Add each material item to the database one by one
            // await addDoc(materialDbRef, materialItem);
            console.log(materialItem)
            await addRawMaterialDetail(materialItem)

            // Update storage based on the material type (Return/Used)
            let existingMaterial = datas.storage.find(
              (storage) =>
                storage.materialName === data.materialName && storage.category === 'Material List'
            )

            if (data.type === 'Return') {
              await updateStorage(existingMaterial.id, {
                quantity: existingMaterial.quantity + Number(data.quantity.split(' ')[0])
              })
            } else {
              await updateStorage(existingMaterial.id, {
                quantity: existingMaterial.quantity - Number(data.quantity.split(' ')[0])
              })
            }
          }
        }
      }

      await rawmaterialUpdateMt()
      await storageUpdateMt()
      setMtOption((pre) => ({ ...pre, tempproduct: [], count: 0 }))
      message.open({
        type: 'success',
        content: `${materialType === 'Used' ? 'Material Used Successfully' : 'Material Return Successfully'}`
      })
      setUsedMaterialModal(false)
    } catch (e) {
      message.open({
        type: 'error',
        content: `${e} ${materialType === 'Used' ? ' Material Used Unsuccessfully' : 'Material Return Unsuccessfully'}`
      })
      console.log(e)
    } finally {
      setIsLoadMaterialUsedModal(false)
      setUnitOnchange('')
    }
  }

  // model cancel
  const materialModelCancel = () => {
    setUnitOnchange('')
    if (mtOption.tempproduct.length > 0) {
      setIsCloseWarning(true)
    } else {
      setUsedMaterialModal(false)
      usedmaterialform.resetFields()
      setMtOption((pre) => ({ ...pre, tempproduct: [], count: 0 }))
    }
  }

  const [isCloseWarning, setIsCloseWarning] = useState(false)

  const warningModalOk = () => {
    if (mtOption.tempproduct.length > 0) {
      setUsedMaterialModal(false)
      usedmaterialform.resetFields()
      setMtOption((pre) => ({ ...pre, tempproduct: [], count: 0 }))
      setIsCloseWarning(false)
    } else {
      setIsCloseWarning(false)
      setIsModalOpen(false)
      setRadioBtn({ status: true, value: '' })
      form.resetFields()
      setSelectedSupplierName(null)
    }
  }

  // supplier onchange
  const supplierOnchange = debounce(async (value, i) => {
    setAddMaterialMethod({ temperorarydata: [], editingKeys: [] })
    setSelectedSupplierName(value)
  }, 300)

  // new add material
  // do not touch
  const AddNewMaterial = async () => {
    let supplierObject = {
      supplierId: addMaterialMethod.supplierdata.supplierid,
      partialAmount:
        addmaterialpaymentform.getFieldsValue().partialAmount === undefined
          ? 0
          : addmaterialpaymentform.getFieldsValue().partialAmount,
      paymentMode:
        addmaterialpaymentform.getFieldsValue().paymentStatus === 'Unpaid'
          ? ''
          : addmaterialpaymentform.getFieldsValue().paymentMode,
      paymentStatus: addmaterialpaymentform.getFieldsValue().paymentStatus,
      type: 'Added',
      isDeleted: 0,
      date: new Date().toISOString(),
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString()
    }
    let materialArray = addMaterialMethod.temperorarydata.map((data, index) => ({
      sno: index + 1,
      id: data.id,
      isDeleted: 0,
      price: data.price,
      quantity: data.quantity,
      createdDate: new Date().toISOString(),
      materialName: data.materialName
    }))
    let totalprice = materialArray.map((data) => data.price).reduce((a, b) => a + b, 0)

    if (
      radioBtn.value === 'Partial' &&
      addmaterialpaymentform.getFieldsValue().partialAmount <= 0
    ) {
      return message.open({ type: 'warning', content: 'Check the partial amount value' })
    }

    try {
      setIsLoadingModal(true)

      console.log('Supplier Details', supplierObject, totalprice)

      const addMaterialRef = await addRawMaterial({ ...supplierObject, billAmount: totalprice })

      // const supplierDbRef = collection(db,'rawmaterial');
      // const createSupplierRef = await addDoc(supplierDbRef,{...supplierObject,billamount:totalprice});
      // const materialDbRef = collection(createSupplierRef,'materialdetails');

      // New Material Add
      const materialPromises = materialArray.map(async (newmaterial) => {
        console.log(newmaterial);

        const existingMaterial = await datas.storage.find(
          (storageItem) =>
            storageItem.category === 'Material List' &&
            storageItem.materialName?.trim().toLowerCase() ===
              newmaterial.materialName?.trim().toLowerCase() &&
            storageItem.isDeleted === 0
        )

        const material = {
          sno: newmaterial.sno,
          rawMaterialId: addMaterialRef.id,
          // rawMaterial: newmaterial.materialName,
          isDeleted: 0,
          // price: newmaterial.price,
          quantity: String(newmaterial.quantity),
          createdDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString()
        }

        console.log('Mat Details', material)

        // await addDoc(materialDbRef,material)

        await addRawMaterialDetail(material)

        console.log(existingMaterial)

        if (existingMaterial) {
          // console.log(existingMaterial.id,{ quantity: existingMaterial.quantity + newmaterial.quantity});
          await updateStorage(existingMaterial.id, {
            quantity: existingMaterial.quantity + newmaterial.quantity
          })
        } else {
          console.log(newmaterial, {
            alertcount: 0,
            category: 'Material List',
            createdDate: TimestampJs(),
            isDeleted: false,
            materialName: newmaterial.materialName,
            quantity: newmaterial.quantity,
            unit: newmaterial.unit
          })

          // await createStorage({alertcount:0,
          //                      category:"Material List",
          //                      createdDate:TimestampJs(),
          //                      isDeleted:false,
          //                      materialName:newmaterial.materialName,
          //                      quantity:newmaterial.quantity,
          //                      unit:newmaterial.unit,
          //                     })
        }
      })
      await Promise.all(materialPromises)
      await rawmaterialUpdateMt()
      setIsModalOpen(false)
      await storageUpdateMt()
      setRadioBtn({ status: true, value: '' })
      form.resetFields()
      setSelectedSupplierName(null)
      message.open({ type: 'success', content: 'Material Added Successfully' })
      setIsLoadingModal(false)

      /*
      // DB Ref
      const supplierDbRef =await collection(db,'rawmaterial');
      // New Supplier
      const createSupplierRef = await addDoc(supplierDbRef,supplierObject);
      // DB Ref
      const materialDbRef = await collection(createSupplierRef,'materialdetails');
     // New Material
     await materialArray.forEach(async material =>{
        await addDoc(materialDbRef,material)
      });

      await addMaterialMethod.temperorarydata.forEach(async material =>{
      const materialdata = {material}
      const existingMaterial = datas.storage.find((storageItem) => storageItem.category === 'Material List' && storageItem.materialName?.trim().toLowerCase() === material.materialName?.trim().toLowerCase() && storageItem.unit?.trim().toLowerCase() === material.unit?.trim().toLowerCase())
      console.log(material);
      console.log(existingMaterial);     
                            }); 

     const existingMaterial = datas.storage.filter(storage=> addMaterialMethod.temperorarydata.find(mateial => storage.category === 'Material List' &&
                              storage.materialName?.trim().toLowerCase() ===mateial.materialName?.trim().toLowerCase() &&
                              storage.unit?.trim().toLowerCase() ===mateial.unit?.trim().toLowerCase()));
       */
    } catch (e) {
      message.open({ type: 'error', content: `${e} Material Added Unsuccessfully` })
      console.log(e)
      setIsLoadingModal(false)
      setIsModalOpen(false)
      setRadioBtn({ status: true, value: '' })
      form.resetFields()
      setSelectedSupplierName(null)
    }
  }

  // const AddNewMaterial = async () => {
  //   if (radioBtn.value === 'Partial' && addmaterialpaymentform.getFieldsValue().partialAmount <= 0) {
  //     return message.open({ type: 'warning', content: 'Check the partial amount value' });
  //   }

  //   try {
  //     await setIsLoadingModal(true);

  //     let supplierObject = {
  //       ...addMaterialMethod.supplierdata,
  //       partialAmount: addmaterialpaymentform.getFieldsValue().partialAmount === undefined ? 0 : addmaterialpaymentform.getFieldsValue().partialAmount,
  //       paymentMode: addmaterialpaymentform.getFieldsValue().paymentStatus === 'Unpaid' ? '' : addmaterialpaymentform.getFieldsValue().paymentMode,
  //       paymentStatus: addmaterialpaymentform.getFieldsValue().paymentStatus,
  //       type: "Added",
  //       isDeleted: false,
  //       createdDate: TimestampJs(),
  //     };

  //     // New Material Add
  //     const materialPromises = addMaterialMethod.temperorarydata.map(async (newmaterial) => {
  //       let materialAndSupplierData = {
  //         ...supplierObject,
  //         materialid: newmaterial.id,
  //         price: newmaterial.price,
  //         quantity: newmaterial.quantity,
  //       };

  //       // Add material to raw material
  //       await createRawmaterial(materialAndSupplierData);

  //       // Check if material exists in storage
  //       let existingMaterial = await datas.storage.find((storageItem) =>
  //         storageItem.category === 'Material List' &&
  //         storageItem.materialName?.trim().toLowerCase() === newmaterial.materialName?.trim().toLowerCase() &&
  //         storageItem.unit?.trim().toLowerCase() === newmaterial.unit?.trim().toLowerCase()
  //       );

  //       // Update storage if material exists
  //       if (existingMaterial) {
  //         await updateStorage(existingMaterial.id, {
  //           quantity: existingMaterial.quantity + newmaterial.quantity,
  //         });
  //       }
  //     });

  //     // Wait for all materials to be added and updated
  //     await Promise.all(materialPromises);

  //     // Update storage and raw material
  //     await storageUpdateMt();
  //     await rawmaterialUpdateMt();

  //     await setIsLoadingModal(false);
  //     setIsModalOpen(false)
  //     setRadioBtn({ status: true, value: '' })
  //     form.resetFields()
  //     setSelectedSupplierName(null)
  //     message.open({type:'success',content:"Material Added Successfully"})
  //   } catch (e) {
  //     console.log(e);
  //     await setIsLoadingModal(false); // Make sure loading is stopped in case of an error
  //     setIsModalOpen(false)
  //     setRadioBtn({ status: true, value: '' })
  //     form.resetFields()
  //     setSelectedSupplierName(null)
  //   }
  // };

  const [materialbill, setmaterialbill] = useState({
    materialdeails: [],
    supplierdetails: {
      name: '',
      partialAmount: 0,
      paymentMode: '',
      paymentStatus: '',
      type: '',
      billamount: 0,
      date: ''
    }
  })
  const [materialBillState, setMaterialBillState] = useState({
    loading: false,
    modal: false
  })

  const materialbillbtn = async (record) => {
    setMaterialBillState((pre) => ({ ...pre, modal: true, loading: true }))

    let { materialitem, status } = await fetchMaterials(record.id)
    if (status) {
      // Use Promise.all to wait for all promises to resolve
      let materialdatas = await Promise.all(
        materialitem.map(async (data) => {
          let { material, status } = await getOneMaterialDetailsById(
            record.type === 'Return' || record.type === 'Used'
              ? data.supplierid
              : record.supplierid,
            data.materialid
          )
          if (status) {
            return {
              ...material,
              sno: data.sno,
              price: data.price,
              quantity: data.quantity,
              date: record.date
            }
          } else {
            return []
          }
        })
      )

      materialdatas.sort((a, b) => a.sno - b.sno)

      setmaterialbill({
        materialdeails: materialdatas,
        supplierdetails: {
          name:
            record.type === 'Return' || record.type === 'Used' ? '' : record.supplier.suppliername,
          partialAmount:
            record.type === 'Return' || record.type === 'Used' ? '' : record.partialAmount,
          paymentMode: record.type === 'Return' || record.type === 'Used' ? '' : record.paymentMode,
          paymentStatus:
            record.type === 'Return' || record.type === 'Used' ? '' : record.paymentStatus,
          type: record.type,
          billamount: record.type === 'Return' || record.type === 'Used' ? '' : record.billamount,
          date: record.date
        }
      })
      setMaterialBillState((pre) => ({ ...pre, loading: false }))
    }
  }

  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const specificData = exportDatas.map((item, index) => ({
      No: index + 1,
      Date: item.date,
      Name: item.supplier?.suppliername || '',
      Mobile: item.supplier?.mobilenumber || '',
      Location: item.supplier?.location || '',
      Gender: item.supplier?.gender || '',
      Type: item.type,
      Billed: item.billamount,
      Partial: item.partialAmount,
      Status: item.paymentStatus,
      Mode: item.paymentMode
    }))
    jsonToExcel(specificData, `RawMaterials-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKey('')
  }

  const materialBillColumn = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50
      // render: (_, __, index) => index + 1,
    },
    // {
    //   title: 'Date',
    //   dataIndex: 'date',
    //   key: 'date',
    //   render:(text) => text,
    //   width: 115
    // },
    {
      title: 'Material Name',
      dataIndex: 'materialName',
      key: 'materialName',
      editable: true,
      render: (text) => {
        return text
      }
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      render: (text, record) => {
        return text + ' ' + record.unit
      }
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      editable: true,
      render: (text) => {
        return text === undefined ? '-' : text
      }
    }
  ]

  const materialUsedTable = TableHeight(200, 455)
  const addMaterialTable = TableHeight(200, 400)
  const [productCount, setProductCount] = useState(0)

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
          <span className="flex gap-x-3 justify-center items-center">
            <RangePicker className="w-[16rem]" onChange={(dates) => setDateRange(dates)} />
            <Button onClick={exportExcel} disabled={editingKey === ''}>
              Export <PiExport />
            </Button>
            <Button
              onClick={() => {
                usedmaterialform.resetFields()
                setUsedMaterialModal(true)
                setProductCount(0)
                console.log(usedmaterialform.getFieldValue().type)
              }}
              type="primary"
              disabled={editingKey !== ''}
            >
              Material Used <IoMdRemove />
            </Button>
            <Button
              disabled={editingKey !== ''}
              type="primary"
              onClick={() => {
                setAddMaterialMethod({ temperorarydata: [], editingKeys: [], supplierdata: {} })
                setIsModalOpen(true)
                addmaterialaddform.resetFields()
                addmaterialpaymentform.resetFields()
                addmaterialtemtableform.resetFields()
                form.setFields({ paymentStatus: 'Paid' })
                form.resetFields()
              }}
            >
              Add Material <IoMdAdd />
            </Button>
          </span>
        </li>
        <li className="mt-2">
          <Form form={form} component={false} initialValues={{ date: dayjs() }}>
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
              loading={isMaterialTbLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
              onScroll={handleTableScroll}
            />
          </Form>
        </li>
      </ul>
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

      <Modal
        // okButtonProps={{ disabled: true }}
        centered={true}
        title={
          <div className="flex  justify-center py-3">
            <h1>ADD MATERIAL</h1>
          </div>
        }
        width={1100}
        open={isModalOpen}
        onOk={async () => {
          console.log('add new material')
          // form.submit()
          // const formValues = form.getFieldsValue()
          // const { materialName, quantity } = formValues
          // const quantityNumber = parseFloat(quantity)
          // const existingMaterial = datas.storage.find(
          //   (storageItem) =>
          //     storageItem.materialName === materialName && storageItem.category === 'Material List'
          // )
          // if (existingMaterial) {
          //   // Update the storage with the new quantity
          //   await updateStorage(existingMaterial.id, {
          //     quantity: existingMaterial.quantity + quantityNumber
          //   })
          //   // Call a function to refresh or update the storage data
          //   storageUpdateMt()
          // }
          // if (!selectedSupplierName) {
          //   setIsModalOpen(false)
          //   setRadioBtn({ status: true, value: '' })
          //   form.resetFields()
          //   setSelectedSupplierName(null)
          // }
        }}
        okButtonProps={{ disabled: selectedSupplierName === null || isLoadingModal }}
        onCancel={() => {
          if (selectedSupplierName !== null) {
            setIsCloseWarning(true)
          } else {
            setIsModalOpen(false)
            setRadioBtn({ status: true, value: '' })
            form.resetFields()
            setSelectedSupplierName(null)
          }
        }}
        maskClosable={selectedSupplierName !== null ? false : true}
        footer={
          <Form
            onFinish={AddNewMaterial}
            form={addmaterialpaymentform}
            initialValues={{ paymentStatus: 'Paid', paymentMode: 'Cash' }}
            layout="horizontal"
            className="flex gap-x-2 justify-end "
          >
            <Form.Item
              // label='Payment Mode'
              className="mb-0 absolute top-7 left-44"
              name="paymentMode"
              rules={[{ required: true, message: 'Please select a payment method' }]}
            >
              <Radio.Group
                disabled={radioBtn.value === 'Unpaid' ? true : false}
                // disabled={option.tempproduct.length <= 0 ? true : false}
              >
                <Radio value="Cash">Cash</Radio>
                <Radio value="Card">Card</Radio>
                <Radio value="UPI">UPI</Radio>
              </Radio.Group>
            </Form.Item>
            <Form.Item
              className="mb-0"
              name="paymentStatus"
              // label="Status"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group buttonStyle="solid" onChange={radioOnchange}>
                <Radio.Button value="Paid">PAID</Radio.Button>
                <Radio.Button value="Unpaid">UNPAID</Radio.Button>
                <Radio.Button value="Partial">PARTIAL</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              className="mb-0"
              name="partialAmount"
              // label="Partial Amount"
              rules={[
                {
                  required:
                    radioBtn.value === 'Partial' || form.getFieldValue('partialAmount') === 0
                      ? true
                      : false,
                  message: false
                },
                { type: 'number', message: false }
              ]}
            >
              <InputNumber
                formatter={(value) => `${value}`}
                disabled={radioBtn.value === 'Partial' ? false : true}
                className="w-full"
                placeholder="Partial Amount"
                type="number"
              />
            </Form.Item>
            <Form.Item className="mb-0">
              <Button
                disabled={
                  addMaterialMethod.temperorarydata.length <= 0 || isLoadingModal ? true : false
                }
                className="w-full"
                type="primary"
                htmlType="submit"
              >
                Add Material
              </Button>
            </Form.Item>
          </Form>
        }
      >
        <Spin spinning={isLoadingModal}>
          <div className="w-full grid grid-cols-7 gap-x-2">
            <span className="col-span-2">
              <Form
                className="flex flex-col gap-y-2 relative"
                onFinish={AddTemMaterial}
                form={addmaterialaddform}
                layout="vertical"
                initialValues={{ date: dayjs() }}
              >
                <Form.Item
                  className="mb-0"
                  name="suppliername"
                  label="Supplier Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    showSearch
                    placeholder="Select the Supplier"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={datas.suppliers
                      .filter((data) => data.isDeleted === 0)
                      .map((sp) => ({ value: sp.id, label: sp.name }))}
                    onChange={(value, i) => supplierOnchange(value, i)}
                  />
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
                  name="materialName"
                  label="Material Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    // suffixIcon='kg'
                    showSearch
                    placeholder="Select the Material"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={materials}
                    onChange={(_, value) => materialNameOnchange(_, value)}
                  />
                </Form.Item>

                <span className="flex gap-x-2">
                  <Form.Item
                    className="mb-0 w-full"
                    name="quantity"
                    label="Quantity"
                    rules={[
                      { required: true, message: false },
                      { type: 'number', message: false }
                    ]}
                  >
                    <InputNumber
                      suffix={<span className="pr-5">{unitOnchange}</span>}
                      min={0}
                      type="number"
                      className="w-full"
                      placeholder="Enter the Quantity"
                    />
                  </Form.Item>
                </span>

                <Form.Item
                  className="mb-0"
                  name="price"
                  label="Price"
                  rules={[
                    { required: true, message: false },
                    { type: 'number', message: false }
                  ]}
                >
                  <InputNumber
                    min={0}
                    className="w-full"
                    type="number"
                    placeholder="Enter the Amount"
                  />
                </Form.Item>
                <Form.Item>
                  <Button className="w-full mt-3" type="primary" htmlType="submit">
                    Add To List
                  </Button>
                </Form.Item>
              </Form>
            </span>

            <span className="col-span-5">
              <Form form={addmaterialtemtableform} component={false}>
                <Table
                  components={{
                    body: {
                      cell: TempEditableCell
                    }
                  }}
                  columns={tempMergedColumns}
                  dataSource={addMaterialMethod.temperorarydata}
                  virtual
                  pagination={false}
                  // className="w-fit"
                  scroll={{ x: false, y: addMaterialTable }}
                />
              </Form>
            </span>
          </div>

          <span
            className={`absolute top-[-2.7rem] right-10 ${addMaterialMethod.temperorarydata.length > 0 ? 'block' : 'hidden'}`}
          >
            <Tag color="blue">
              Total Amount : <span className="text-sm">{totalFormAmount}</span>
            </Tag>
          </span>
        </Spin>
      </Modal>

      {/* material used model */}
      <Modal
        maskClosable={mtOption.tempproduct.length > 0 ? false : true}
        className="relative materialused-modal"
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h2>MATERIAL USED</h2>{' '}
          </div>
        }
        width={1000}
        centered={true}
        open={usedMaterialModal}
        onCancel={materialModelCancel}
        okButtonProps={{ disabled: true }}
        footer={
          <Button
            type="primary"
            disabled={mtOption.tempproduct.length > 0 && !isLoadMaterialUsedModal ? false : true}
            onClick={addNewTemMaterial}
            className="w-fit mt-0"
          >
            Add
          </Button>
        }
      >
        <Spin spinning={isLoadMaterialUsedModal}>
          <div className="grid grid-cols-4 gap-x-3">
            <span className="col-span-1 ">
              <Form
                className="relative"
                onFinish={createUsedMaterial}
                form={usedmaterialform}
                layout="vertical"
                initialValues={{ date: dayjs(), type: 'Used' }}
              >
                <Form.Item
                  className=" absolute top-[-3rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
                </Form.Item>

                <Form.Item
                  name="type"
                  // className="mb-1 mt-3"
                >
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                    onChange={(e) => {
                      setMaterialType(e.target.value)
                    }}
                  >
                    <Radio.Button value="Used" style={{ width: '50%' }}>
                      USED
                    </Radio.Button>
                    <Radio.Button value="Return" style={{ width: '50%' }}>
                      RETURN
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  // className="mb-2"
                  name="materialName"
                  label="Material Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    showSearch
                    placeholder="Select the Material"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={mtOption.material}
                    onChange={async (_, value) => {
                      let storage = await getStorages()
                      let material =
                        storage.filter(
                          (data) =>
                            data.category === 'Material List' &&
                            data.isDeleted === 1 &&
                            data.materialName === value.label
                        ) || []
                      setProductCount(material.length > 0 ? material[0].quantity : 0)

                      setUnitOnchange(value.unit)
                    }}
                  />
                </Form.Item>
                <span
                  className={` absolute left-[72px]  ${materialType === 'Return' ? 'hidden' : 'inline-block'} `}
                >
                  <Tag
                    className="w-full flex justify-between items-center"
                    color={`${productCount <= 0 ? 'red' : 'green'}`}
                  >
                    <PiGarageBold size={16} /> {productCount}{' '}
                  </Tag>
                </span>
                <span className="flex gap-x-2 ">
                  <Form.Item
                    className=" w-full"
                    name="quantity"
                    label="Quantity"
                    rules={[{ required: true, message: false }]}
                  >
                    <InputNumber
                      min={0}
                      className="w-full"
                      type="number"
                      placeholder="Enter the Quantity"
                      suffix={<span className="pr-6">{unitOnchange}</span>}
                    />
                  </Form.Item>
                </span>

                <Form.Item
                // className=" w-full mt-2"
                >
                  <Button className="w-full mt-4" type="primary" htmlType="submit">
                    Add To List
                  </Button>
                </Form.Item>
              </Form>
            </span>
            <span className="col-span-3">
              <Form form={materialUsedForm}>
                <Table
                  virtual
                  components={{
                    body: {
                      cell: materialUsedEditableCell
                    }
                  }}
                  columns={materialUsedColumns}
                  dataSource={mtOption.tempproduct}
                  // pagination={{ pageSize: 4 }}
                  pagination={false}
                  scroll={{ x: false, y: materialUsedTable }}
                />
              </Form>
            </span>
          </div>
        </Spin>
      </Modal>

      <Modal
        width={800}
        footer={<></>}
        open={materialBillState.modal}
        onCancel={() => setMaterialBillState((pre) => ({ ...pre, modal: false }))}
      >
        <Spin spinning={materialBillState.loading}>
          <div className="relative">
            <Table
              virtual
              scroll={{ x: false, y: false }}
              className="mt-8"
              dataSource={materialbill.materialdeails}
              columns={materialBillColumn}
              pagination={false}
            />
            <span className="absolute -top-9 -translate-x-1/2 left-1/2 flex ">
              {' '}
              <span className="font-semibold inline-block pr-2">
                {' '}
                {materialbill.supplierdetails.type === 'Return'
                  ? 'RETURN ON'
                  : materialbill.supplierdetails.type === 'Used'
                    ? 'USED ON'
                    : 'RECEIVED ON'}{' '}
                {materialbill.supplierdetails.date}
              </span>
              <Tag
                className={`${materialbill.supplierdetails.paymentStatus === '' ? 'hidden' : ''}`}
                color={`${materialbill.supplierdetails.paymentStatus === 'Partial' ? 'yellow' : materialbill.supplierdetails.paymentStatus === 'Paid' ? 'green' : materialbill.supplierdetails.paymentStatus === 'Unpaid' ? 'red' : ''}`}
              >
                {materialbill.supplierdetails.paymentStatus}
              </Tag>
              <Tag
                className={`${materialbill.supplierdetails.paymentStatus === 'Unpaid' || materialbill.supplierdetails.paymentStatus === '' ? 'hidden' : 'inline-block'}`}
                color="blue"
              >
                {materialbill.supplierdetails.paymentMode}{' '}
              </Tag>{' '}
            </span>

            <span
              className={`absolute -top-9 left-6 ${materialbill.supplierdetails.name === '' ? 'hidden' : ''}`}
            >
              <Tag color="blue">{materialbill.supplierdetails.name} </Tag>{' '}
            </span>

            <span
              className={`text-[0.8rem] font-medium inline-block pt-4 ${materialbill.supplierdetails.billamount === '' ? 'hidden' : ''}`}
            >
              Billing Amount: <Tag color="green">{materialbill.supplierdetails.billamount}</Tag>
            </span>
            <span
              className={`text-[0.8rem] font-medium inline-block pt-4  ${materialbill.supplierdetails.paymentStatus !== 'Partial' ? 'hidden' : 'inline-bock'}`}
            >
              Partial Amount: <Tag color="yellow">{materialbill.supplierdetails.partialAmount}</Tag>
            </span>
            <span
              className={`text-[0.8rem] font-medium inline-block pt-4  ${materialbill.supplierdetails.paymentStatus !== 'Partial' ? 'hidden' : 'inline-bock'}`}
            >
              Balance:{' '}
              <Tag color="red">
                {materialbill.supplierdetails.billamount -
                  materialbill.supplierdetails.partialAmount}
              </Tag>
            </span>

            {/* ${materialbill.supplierdetails.paymentStatus === ''} */}
          </div>
        </Spin>
      </Modal>
    </div>
  )
}
