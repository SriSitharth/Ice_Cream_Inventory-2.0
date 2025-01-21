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
  Popover,
  Empty,
  Tooltip
} from 'antd'
import { MdProductionQuantityLimits } from 'react-icons/md'
import { IoCloseCircle } from 'react-icons/io5'
import {
  SolutionOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons'
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { PiExport } from 'react-icons/pi'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import dayjs from 'dayjs'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { PiWarningCircleFill } from 'react-icons/pi'
const { Search, TextArea } = Input
import { debounce } from 'lodash'
import { areArraysEqual } from '../js-files/compare-two-array-of-object'
import { getMissingIds } from '../js-files/missing-id'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { formatName } from '../js-files/letter-or-name'
import { truncateString } from '../js-files/letter-length-sorting'
import './css/SupplierList.css'
// APIs
import { addSupplier, updateSupplier, addSupplierPayment, getSupplierPaymentsById, updateSupplierPayment } from '../sql/supplier'
import { addStorage, updateStorage } from '../sql/storage'
import { getRawMaterials } from '../sql/rawmaterial'
import { addSupplierAndMaterial, getMaterialsBySupplierId, getSupplierAndMaterials, updateSupplierAndMaterial } from '../sql/supplierandmaterials'

export default function SupplierList({ datas, supplierUpdateMt, storageUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [expantableform] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [payForm] = Form.useForm()
  const [materialForm] = Form.useForm()
  const [isPayModelOpen, setIsPayModelOpen] = useState(false)
  const [isPayDetailsModelOpen, setIsPayDetailsModelOpen] = useState(false)
  const [supplierPayId, setSupplierPayId] = useState(null)
  const [payDetailsData, setPayDetailsData] = useState([])
  const [supplierTbLoading, setSupplierTbLoading] = useState(true)
  const [totalBalanceAmount, setTotalBalanceAmount] = useState(0)
  const [totalPurchaseAmount, setTotalPurchaseAmount] = useState(0)
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0)

  // side effect
  useEffect(() => {
    setSupplierTbLoading(true)
    const filteredData = datas.suppliers.map((item, index) => ({
      ...item,
      sno: index + 1,
      key: item.id || index
    }))
    // setData(filteredData)

    async function fetchMaterialItems() {
      let getAlldatas = await Promise.all(filteredData.map(async data=>{
        let materials = await getMaterialsBySupplierId(data.id);
        return ({...data, supplierandmaterials:materials.filter(data=> data.isDeleted === 0)})
      }))
      setData(getAlldatas)
      setSupplierTbLoading(false)
      console.log(getAlldatas)
    }
    fetchMaterialItems()
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

  const [supplierModalLoading, setSupplierModalLoading] = useState(false)
  // create new project
  const createNewSupplier = async (values) => {
    let correctNameData = values.material.map((data) => ({
      ...data,
      name: formatName(data.name)
    }))
    console.log(correctNameData)
    // Create a map to count occurrences of each materialname
    const nameCount = correctNameData.reduce((acc, data) => {
      acc[data.name] = (acc[data.name] || 0) + 1
      return acc
    }, {})

    // Find all material names that have more than 1 occurrence
    const duplicateNames = Object.keys(nameCount).filter((name) => nameCount[name] > 1)

    if (duplicateNames.length > 0) {
      return message.open({
        type: 'warning',
        content: `Same material found ${duplicateNames.map((data) => data)}`
      })
    }

    if (values.material.length === 0) {
      return message.open({ type: 'info', content: 'Add one material' })
    }

    const { material, ...value } = values

    const correctMaterialName = await Promise.all(
      material.map(async (data) => ({
        ...data,
        name: formatName(data.name)
      }))
    )

    const supplierDatas = {
      ...value,
      name: formatName(value.name),
      mobileNumber: value.mobileNumber,
      address: value.address,
      // gender: 'Male',
      createdDate: new Date().toISOString(),
      modifiedDate: new Date().toISOString(),
      isDeleted: 0
    }

    // const materialExists = datas.storage.find(storageItem =>
    //   material.some( item =>
    //     storageItem.materialname === item.materialname &&
    //     storageItem.category === 'Material List' &&
    //     storageItem.unit === item.unit
    //   )
    // );

    const materialExist = correctMaterialName.filter(
      (item) =>
        !datas.storage.some(
          (storage) =>
            storage.materialName === item.name &&
            storage.category === 'Material List' &&
            storage.unit === item.unit
        )
    )

    console.log('newmaterial', materialExist)

    setSupplierModalLoading(true)
    try {

      const addedSupplier = await addSupplier(supplierDatas)

      for (const materialItem of correctMaterialName) {
        await addSupplierAndMaterial({
          name: materialItem.name,
          unit: materialItem.unit,
          supplierId: addedSupplier.id,
          isDeleted: 0,
          createdDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString()
        })
      }

      // new material add storage
      if (materialExist.length > 0) {
        for (const items of materialExist) {
          await addStorage({
            materialName: items.name,
            unit: items.unit,
            alertCount: 0,
            quantity: 0,
            isDeleted: 0,
            category: 'Material List',
            createdDate: new Date().toISOString(),
            modifiedDate: new Date().toISOString()
          })
        }
      }

      await supplierUpdateMt()
      await storageUpdateMt()
      form.resetFields()
      message.open({ type: 'success', content: 'Supplier Added Successfully' })
    } catch (e) {
      console.log(e)
      message.open({ type: 'error', content: `${e} Supplier Added Unsuccessfully` })
    } finally {
      setSupplierOnchangeValue('')
      setSupplierModalLoading(false)
      setIsModalOpen(false)
    }
  }

  const showPayModal = (record) => {
    setSupplierName(record.name)
    payForm.resetFields()
    setSupplierPayId(record.id)
    setIsPayModelOpen(true)
  }

  const [payModalLoading, setPayModalLoading] = useState(false)

  const supplierPay = async (value) => {
    setPayModalLoading(true)
    let { date, decription, ...Datas } = value
    let formateDate = (dayjs(date).format('YYYY-MM-DD')) || (dayjs().format('YYYY-MM-DD'))
    const payData = {
      ...Datas,
      date: formateDate,
      modifiedDate: new Date().toISOString(),
      decription: decription || '',
      createdDate: new Date().toISOString(),
      collectionType: 'supplier',
      supplierId: supplierPayId,
      type: 'Payment',
      isDeleted: 0
    }
    try {
      // const customerDocRef = doc(db, 'supplier', supplierPayId)
      // const payDetailsRef = collection(customerDocRef, 'paydetails')
      // await addDoc(payDetailsRef, payData)
      console.log(payData)
      await addSupplierPayment(payData)
    } catch (e) {
      console.log(e)
    } finally {
      payForm.resetFields()
      setSupplierPayId(null)
      setIsPayModelOpen(false)
      setPayModalLoading(false)
      setAmountOnchangeValue('')
      message.open({ type: 'success', content: 'Payed successfully' })
    }
  }

  const [supplierName, setSupplierName] = useState('')

  const showPayDetailsModal = async (record) => {
    setSupplierName(record.name)
    try {
      let rawmaterial = await getRawMaterials()
      let paydetails = await getSupplierPaymentsById(record.id)
      if (rawmaterial.length > 0) {
        let filterBillOrders = rawmaterial
          .filter((data) => record.id === data.supplierId && data.isDeleted === 0)
          .map((data) => ({ ...data, name: record.name }))
        let getPaydetials = paydetails.filter((paydata) => paydata.isDeleted === 0)

        let sortData = await latestFirstSort([...filterBillOrders, ...getPaydetials])
        console.log(sortData)
        setPayDetailsData(sortData)
        

        // calculation
        const totalBalance = sortData.reduce((total, item) => {
          if (item.type === 'Added' && item.paymentStatus === 'Unpaid') {
            return total + (Number(item.billAmount) || 0)
          } else if (item.type === 'Added' && item.paymentStatus === 'Partial') {
            return total + (Number(item.billAmount) - Number(item.partialamount) || 0)
          } else if (item.type !== 'Added') {
            return total - (Number(item.amount) || 0)
          }
          return total
        }, 0)
        setTotalBalanceAmount(totalBalance)

        const totalPayment = sortData.reduce((total, item) => {
          if (item.type === 'Added' && item.paymentStatus === 'Paid') {
            return total + (Number(item.billAmount) || 0)
          } else if (item.type === 'Added' && item.paymentStatus === 'Partial') {
            return total + (Number(item.partialamount) || 0)
          } else if (item.type !== 'Added') {
            return total + (Number(item.amount) || 0)
          }
          return total
        }, 0)
        setTotalPaymentAmount(totalPayment)

        const totalPurchase = sortData.reduce((total, item) => {
          if (item.type === 'Added') {
            return total + (Number(item.billAmount) || 0)
          }
          return total
        }, 0)
        setTotalPurchaseAmount(totalPurchase)
      }
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
      render: (text, record, index) => <span>{index + 1}</span>,
      width: 50
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => {
        const dateA = dayjs(a.date)
        const dateB = dayjs(b.date)
        return dateA.isAfter(dateB) ? 1 : -1
      },
      defaultSortOrder: 'descend',
      render: (text) => dayjs(text).format('DD/MM/YYYY'),
      width: 115
    },
    // {
    //   title: 'Material',
    //   dataIndex: 'materialname',
    //   key: 'materialname',
    //   render: (text) => text ? text : '-'
    // },
    // {
    //   title: 'Quantity',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   render: (text, record) =>
    //     record.quantity !== undefined ? record.quantity + ' ' + record.unit : '-',
    //   width: 100
    // },
    {
      title: 'Amount',
      dataIndex: 'price',
      key: 'price',
      render: (text, record) =>
        record.billAmount === undefined
          ? formatToRupee(record.amount, true)
          : formatToRupee(record.billAmount, true),
      width: 130
    },
    {
      title: 'Type',
      dataIndex: 'price',
      key: 'price',
      render: (text, record) =>
        record.type === undefined ? '-' : <Tag color="green">{record.type}</Tag>,
      width: 130
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (text, record) =>
        record.paymentStatus === undefined ? (
          <>
            <Tag color="cyan">{record.paymentMode}</Tag>
            <span></span>
          </>
        ) : record.paymentStatus === 'Paid' ? (
          <span className="flex items-center">
            <Tag color="green">Paid</Tag>
            {record.paymentMode && <Tag color="cyan">{record.paymentMode}</Tag>}
          </span>
        ) : record.paymentStatus === 'Unpaid' ? (
          <Tag color="red">UnPaid</Tag>
        ) : record.paymentStatus === 'Partial' ? (
          <span className="flex items-center">
            <Tag color="yellow">Partial</Tag>{' '}
            <Tag color="blue" className=" text-[0.7rem]">
              {formatToRupee(record.partialamount, true)}
            </Tag>
            {record.paymentMode && <Tag color="cyan">{record.paymentMode}</Tag>}
          </span>
        ) : (
          <></>
        ),
      width: 180
    },
    {
      title: 'Description',
      dataIndex: 'decription',
      key: 'decription',
      render: (text, record) => (record.decription === undefined ? '-' : record.decription)
    }
  ]

  const [openPopoverRow, setOpenPopoverRow] = useState(null)
  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        console.log(record)
        return (
          String(record.name).toLowerCase().includes(value.toLowerCase()) ||
          // String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.address).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobileNumber).toLowerCase().includes(value.toLowerCase()) ||
          // String(record.gender).toLowerCase().includes(value.toLowerCase()) ||
          record.supplierandmaterials.some((data) =>
            String(data.name).toLowerCase().includes(value.toLowerCase())
          )
        )
      }
    },
    {
      title: 'Supplier',
      dataIndex: 'name',
      key: 'name',
      editable: true,
      sorter: (a, b) => a.name.localeCompare(b.name),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    // {
    //   title: 'Material',
    //   dataIndex: 'materialname',
    //   key: 'materialname',
    //   editable: true,
    //   sorter: (a, b) => a.materialname.localeCompare(b.materialname),
    //   showSorterTooltip: { target: 'sorter-icon' }
    // },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      editable: true,
      sorter: (a, b) => a.address.localeCompare(b.address),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text, record) => {
        return text.length > 18 ? <Tooltip title={text}>{truncateString(text, 18)}</Tooltip> : text
      }
    },
    {
      title: 'Mobile',
      dataIndex: 'mobileNumber',
      key: 'mobileNumber',
      editable: true,
      width: 136
    },
    // {
    //   title: 'Gender',
    //   dataIndex: 'gender',
    //   key: 'gender',
    //   editable: true,
    //   width: 83
    // },
    {
      title: "Material",
      dataIndex: 'material',
      key: 'material',
      width: 80,
      render: (_, record) => {
        return (
          <>
            <Button onClick={() => handlePopoverClick(record.id)} className="h-[1.7rem]">
            <MdProductionQuantityLimits/>
            </Button>
            <Popover
              content={<div>
              {
                record.supplierandmaterials.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : record.supplierandmaterials.sort((a,b)=> a.name.localeCompare(b.name)).map((data,i)=>{
                return <span>{i+1}.{data.name} {'-'} {data.unit}<br/> </span>
              })
             }
                <IoCloseCircle color='red' size={20} className='absolute right-2 top-2 cursor-pointer' onClick={() => setOpenPopoverRow(null)}/>
              </div>}
              title="Material"
              trigger="click"
              open={openPopoverRow === record.id} // Open only for the clicked row
              onOpenChange={(visible) => handlePopoverOpenChange(visible, record.id)}
            >
            </Popover>
          </>
        );
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
          <span className="flex gap-x-3 justify-center items-center">
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
              onClick={() => {
                // edit(record)
                editSupplier(record)
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

  const [editSupplierModal, setEditSupplierModal] = useState(false)
  const [editBtnData, setEditBtnData] = useState({})
  const editSupplier = async (record) => {
    setEditBtnData(record)
    setEditSupplierModal(true)
    // Set the form fields with the correct values from the record
    form.setFieldsValue({
      name: record.name,
      // gender: record.gender,
      address: record.address,
      mobileNumber: record.mobileNumber,
      material: record.supplierandmaterials
      // Ensure materialdetails is an array of objects with the expected structure
    })

    // Open the modal after setting the form values
    setIsModalOpen(true)
  }

  const updateSupllierMt = async () => {
    try {
      let { id, ...olddata } = editBtnData
      let supplerId = id
      let { material, ...newdata } = form.getFieldValue()
      let oldmaterial = olddata.supplierandmaterials
      
      let missingIds = await getMissingIds(olddata.supplierandmaterials, material)
      // let missingIds = await material.filter(aObj => !olddata.item.some(bObj => aObj.id === bObj.id));
      let newMaterialItems = material
        .filter((item) => !item.hasOwnProperty('id'))
        .map((data) => ({ ...data }))
      let updatedMaterialItems = material.filter((item) => item.hasOwnProperty('id'))
      let compareArrObj = await areArraysEqual(updatedMaterialItems, olddata.supplierandmaterials)

      console.log(oldmaterial,newMaterialItems,material)
      // check same material
      let sameItem = oldmaterial.filter((old) =>
        newMaterialItems.find((newdata) => newdata.name === old.name)
      )

      if (sameItem.length === oldmaterial.length) {
        return message.open({
          type: 'warning',
          content: `Not allow same material ${sameItem.map((data) => {
            return data.name
          })}`
        })
      }

      if (
        olddata.address === newdata.address &&
        olddata.mobileNumber === newdata.mobileNumber &&
        olddata.name === newdata.name &&
        material.length === olddata.supplierandmaterials.length &&
        compareArrObj
      ) {
        message.open({ content: 'No changes found', type: 'info' })
      } else {
        setSupplierModalLoading(true)
        // update supplier
        await updateSupplier(supplerId, { ...newdata })

        // update items
        if (compareArrObj === false) {
          for (const items of updatedMaterialItems) {
            const { id, createddate, isDeleted, ...newupdateddata } = items
            const itemId = id
            // add supplierId if want
            await updateSupplierAndMaterial( itemId, {
              ...newupdateddata
            })

            console.log('Checking for material:', items.name, items.unit)
            console.log('Storage data:', datas.storage)

            const materialExists = datas.storage.find(
              (storageItem) =>
                storageItem.category === 'Material List' &&
                storageItem.materialName?.trim().toLowerCase() ===
                  items.name?.trim().toLowerCase() &&
                storageItem.unit?.trim().toLowerCase() === items.unit?.trim().toLowerCase()
            )
            if (!materialExists) {
              await addStorage({
                materialName: items.name,
                unit: items.unit,
                alertCount: 0,
                quantity: 0,
                isDeleted: 0,
                category: 'Material List',
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
              })
              await storageUpdateMt()
            }
          }
        }

        // add new items
        if (newMaterialItems.length > 0) {
          for (const items of newMaterialItems) {
            const { id, createddate, isDeleted, ...newupdateddata } = items
            console.log(supplerId, newupdateddata, items)
            await addSupplierAndMaterial({
              ...newupdateddata,
              SupplierId: supplerId,
              createdDate: new Date().toISOString(),
              modifiedDate: new Date().toISOString(),
              isDeleted: 0
            })
            const materialExists = datas.storage.find(
              (storageItem) =>
                storageItem.materialName === newupdateddata.name &&
                storageItem.category === 'Material List' &&
                storageItem.unit === newupdateddata.unit
            )
            if (!materialExists) {
              await addStorage({
                materialName: newupdateddata.name,
                unit: newupdateddata.unit,
                alertCount: 0,
                quantity: 0,
                isDeleted: 0,
                category: 'Material List',
                createdDate: new Date().toISOString(),
                modifiedDate: new Date().toISOString()
              })
            }
          }
          await storageUpdateMt()
        }

        // delete the items
        if (missingIds.length > 0) {
          missingIds.map(async (id) => {
            await updateSupplierAndMaterial(id, {
              isDeleted: 1
            })
          })
        }

        for (const oldItem of olddata.supplierandmaterials) {
          const newItem = material.find(
            (mItem) => mItem.name === oldItem.name && mItem.unit === oldItem.unit
          )
          const allMaterials = await getSupplierAndMaterials()
          const isMaterialInSupplierList = allMaterials.find(
            (mItem) => mItem.name === oldItem.name && mItem.unit === oldItem.unit
          )
          if (!newItem && !isMaterialInSupplierList) {
            const oldMaterialExists = datas.storage.find(
              (storageItem) =>
                storageItem.name === oldItem.name &&
                storageItem.category === 'Material List' &&
                storageItem.unit === oldItem.unit
            )
            console.log(oldMaterialExists, newItem, isMaterialInSupplierList, allMaterials)
            if (oldMaterialExists) {
              await updateStorage(oldMaterialExists.id, { isDeleted: 1 })
              await storageUpdateMt()
            }
          }
        }

        await supplierUpdateMt()
        setIsCloseWarning(false)
        setIsModalOpen(false)
        form.resetFields()
        setSupplierOnchangeValue('')
        setIsPayModelOpen(false)
        setIsCloseWarning(false)
        setAmountOnchangeValue('')
        setSupplierModalLoading(false)
        await message.open({ content: 'Updated successfully', type: 'success' })
      }
    } catch (e) {
      console.log(e)
      message.open({ content: `${e} Updated Unsuccessfully`, type: 'error' })
    }
  }

  const handlePopoverClick = (id) => {
    setOpenPopoverRow(id) // Set the ID of the row whose Popover is open
  }

  const handlePopoverOpenChange = (visible, id) => {
    if (visible) {
      setOpenPopoverRow(id) // Open Popover for this row
    } else {
      setOpenPopoverRow(null) // Close the Popover
    }
  }

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
              <Form.Item
                name={dataIndex}
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                {inputNode}
              </Form.Item>
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
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (
        index != null &&
        row.name === key.name &&
        // row.materialname === key.materialname &&
        row.address === key.address &&
        row.mobileNumber === key.mobileNumber
        // row.gender === key.gender
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateSupplier(key.id, { ...row })
        supplierUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  }

  const handleRowClick = (record) => {
    setAddNewMaterial((pre) => ({ ...pre, popover: true }))
    console.log(record.id)
  }

  // useEffect(()=>{
  //   const fatchData =()=>{
  //     let {materials,status} =  getMaterialDetailsById(record.id);
  //   }
  // },[])
  const [editExpandTablekey, setEditExpandTableKey] = useState([])
  const expandableTable = [
    {
      title: 'S.No',
      key: 'sno',
      render: (text, record, i) => <span>{i + 1}</span>,
      width: 50,
      editable: false
    },
    {
      title: 'Material',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span>{text}</span>,
      editable: true
    },
    {
      title: 'Unit',
      key: 'unit',
      dataIndex: 'unit',
      render: (text) => <span>{text}</span>,
      width: 100,
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 100,
      render: (_, record) => {
        const editable = isEditingExpandTable(record)
        return editable ? (
          <span className="flex gap-x-1 justify-center items-center">
            <Typography.Link
              onClick={() => ExpandTableSave(record)}
              style={{
                marginRight: 8
              }}
            >
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm
              title="Sure to cancel?"
              onConfirm={() => {
                setEditExpandTableKey([])
                setEditingKeys([])
              }}
            >
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 justify-center items-center">
            <Typography.Link
              disabled={editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => editExpandTable(record)}
            >
              <MdOutlineModeEditOutline size={20} />
            </Typography.Link>
            <Popconfirm
              disabled={editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0}
              className={`${editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0 ? 'cursor-not-allowed' : 'cursor-pointer'} `}
              title="Sure to delete?"
              onConfirm={() => deleteExpantableTableMaterial(record)}
            >
              <AiOutlineDelete
                className={`${editExpandTablekey.length !== 0 || selectedRowKeys.length !== 0 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
                size={19}
              />
            </Popconfirm>
          </span>
        )
      }
    }
  ]

  const deleteExpantableTableMaterial = async (record) => {
    setSupplierTbLoading(true)
    await updateSupplierAndMaterial( record.id, {
      isDeleted: 1
    })
    setSupplierTbLoading(false)
  }

  const expandableEditableCell = ({
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
            {dataIndex === 'unit' ? (
              <Form.Item
                name="unit"
                style={{ margin: 0 }}
                rules={[{ required: true, message: false }]}
              >
                <Select
                  placeholder="Units"
                  options={[
                    { label: 'GM', value: 'gm' },
                    { label: 'KG', value: 'kg' },
                    { label: 'LT', value: 'lt' },
                    { label: 'ML', value: 'ml' },
                    { label: 'Box', value: 'box' },
                    { label: 'Piece', value: 'piece' }
                  ]}
                />
              </Form.Item>
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

  const isEditingExpandTable = (record) => editExpandTablekey.includes(record.id)

  const editExpandTable = (record) => {
    setEditingKeys([record.id])
    expantableform.setFieldsValue({ ...record })
    setEditExpandTableKey([record.id])
  }

  const mergedColumnsExpandTable = expandableTable.map((col) => {
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
        editing: isEditingExpandTable(record)
      })
    }
  })

  const [expandTableSupplierId, setExpandTableSupplierId] = useState('')
  const [addNewMaterial, setAddNewMaterial] = useState({
    modal: false,
    spin: false,
    closewarning: false,
    popover: false
  })
  const expandableProps = {
    expandedRowRender: (record) => {
      setExpandTableSupplierId(record.id)
      return (
        <div className="w-[71%] mx-auto relative">
          <span className="flex justify-end items-center mb-1">
            <Button
              className="mb-1"
              type="primary"
              onClick={() => setAddNewMaterial((pre) => ({ ...pre, modal: true }))}
            >
              Add
            </Button>
          </span>
          <Form form={expantableform} component={false}>
            <Table
              virtual
              components={{
                body: {
                  cell: expandableEditableCell
                }
              }}
              pagination={false}
              columns={mergedColumnsExpandTable}
              dataSource={record.item.filter((data) => data.isDeleted === 0)}
              rowClassName="editable-row"
              scroll={{ x: 200, y: 200 }}
            />
          </Form>
        </div>
      )
    }
  }

  const ExpandTableSave = async (key) => {
    try {
      const row = await expantableform.validateFields()
      const newData = [...data]
      const index = newData.findIndex((item) => key.id === item.key)
      if (index != null && row.name === key.name && row.unit === key.unit) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
        setEditExpandTableKey([])
      } else {
        setSupplierTbLoading(true)
        // console.log(expandTableSupplierId);
        // console.log(key.id, { ...row, updateddate: TimestampJs() });
        await updateSupplierAndMaterial( key.id, {
          ...row
        })
        // await updateSupplier(key.id, { ...row, updateddate: TimestampJs() })
        supplierUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
        setEditExpandTableKey([])
        setSupplierTbLoading(false)
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
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

  // delete
  const deleteProduct = async (data) => {
    // await deleteproduct(data.id);
    try {
    const { id, ...newData } = data
    let paydetails = await getSupplierPaymentsById(id)
    if (paydetails.length > 0) {
      await Promise.all(
      paydetails.map(async (paydata) => {
        await updateSupplierPayment(id, paydata.id, { isDeleted: 1 })
      })
    );
    }
    let materialdetails = await getMaterialsBySupplierId(id)
    console.log(materialdetails,paydetails)
    if (materialdetails.length > 0){
      await Promise.all(
      materialdetails.map(async (materialdata) =>{
        await updateSupplierAndMaterial(materialdata.id, { isDeleted: 1 })
      })
      );
    }
    await updateSupplier(id, {
      isDeleted: 1
    })
    message.open({ type: 'success', content: 'Deleted Successfully' })
    await supplierUpdateMt()
  }catch (error) {
      console.error("Error deleting product:", error);
      message.open({ type: 'error', content: 'Failed to delete product' });
    }
  }

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const excelDatas = exportDatas.map((pr, i) => ({
      No: i + 1,
      Supplier: pr.name,
      // Gender: pr.gender,
      Mobile: pr.mobileNumber,
      Address: pr.address
    }))
    jsonToExcel(excelDatas, `Supplier-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKeys('')
  }

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

  // warning close btns methods
  const [supplierOnchangeValue, setSupplierOnchangeValue] = useState('')
  const productOnchange = debounce((value) => {
    setSupplierOnchangeValue(value)
  }, 200)

  const [amountOnchangeValue, setAmountOnchangeValue] = useState('')
  const amountOnchange = debounce((value) => {
    setAmountOnchangeValue(value)
  }, 200)

  const [isCloseWarning, setIsCloseWarning] = useState(false)

  const warningModalOk = (value) => {
    if (value === 'newsupplier') {
      setIsCloseWarning(false)
      setIsModalOpen(false)
      form.resetFields()
      setSupplierOnchangeValue('')

      setIsPayModelOpen(false)
      setIsCloseWarning(false)
      setAmountOnchangeValue('')
    } else {
      console.log('material')
    }
  }

  useEffect(() => {
    if (isModalOpen) {
      // Ensure there's at least one material field when the modal opens
      const currentMaterials = form.getFieldValue('material') || []
      if (currentMaterials.length === 0) {
        form.setFieldsValue({
          material: [{ name: '', unit: '' }]
        })
      }
    }

    if (addNewMaterial.modal) {
      const currentMaterials = materialForm.getFieldValue('material') || []
      if (currentMaterials.length === 0) {
        materialForm.setFieldsValue({
          material: [{ name: '', unit: '' }]
        })
      }
    }
  }, [isModalOpen, form, addNewMaterial.modal, materialForm])

  const addNewMaterialMt = () => {
    if (materialForm.getFieldValue().material.length === 0) {
      message.open({ type: 'info', content: 'Add one material' })
    }
  }

  return (
    <div className="relative">
      {/* <div className='absolute right-[20rem] '>
    <Popover
      
      content={<a >Close</a>}
      title="Title"
      trigger="click"
      open={addNewMaterial.popover}
      // onCancel={()=> setAddNewMaterial(pre=>({...pre,popover:false}))}
      onOpenChange={()=> setAddNewMaterial(pre=>({...pre,popover:false}))}
    >
      
    </Popover>
    </div> */}

      <Modal
        zIndex={1001}
        centered={true}
        width={300}
        title={
          <span className="flex gap-x-1 justify-center items-center">
            <PiWarningCircleFill className="text-yellow-500 text-xl" /> Warning
          </span>
        }
        open={isCloseWarning}
        onOk={() => warningModalOk('newsupplier')}
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
              disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0}
              onClick={exportExcel}
            >
              Export <PiExport />
            </Button>
            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              type="primary"
              onClick={() => {
                setEditSupplierModal(false)
                setIsModalOpen(true)
                form.resetFields()
                // form.setFieldsValue({ gender: 'Male' });
                form.setFieldsValue({
                  material: [
                    {
                      unit: undefined
                    }
                  ]
                })
              }}
            >
              New Supplier <IoMdAdd />
            </Button>
          </span>
        </li>

        <li className="mt-2 ">
          <Form form={form} component={false}>
            <Table
              // className="expandtables"
              virtual
              components={{
                body: {
                  cell: EditableCell
                }
              }}
              dataSource={data}
              columns={mergedColumns}
              pagination={false}
              loading={supplierTbLoading}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
              // onRow={(record) => ({
              //   onClick: () => handleRowClick(record), // Capture row click event
              //     })}
              // expandable={expandableProps}
            />
          </Form>

          {/* <div>
        <Form form={expantableform} component={false} > 
      <Table 
      virtual 
      components={{
        body:{
          cell:expandableEditableCell
          }
          }} 
      pagination={false}
      columns={mergedColumnsExpandTable} 
      // dataSource={record.item.filter(data=> data.isDeleted === false)}
      rowClassName="editable-row"
      scroll={{ x: 300,y:200}}
      /></Form>
        </div> */}
        </li>
      </ul>

      <Modal
        centered={true}
        maskClosable={
          form.getFieldValue('name') === undefined ||
          form.getFieldValue('name') === null ||
          form.getFieldValue('name') === ''
            ? true
            : false
        }
        title={
          <span className="flex justify-center">
            {editSupplierModal ? 'UPDATE SUPPLIER' : 'NEW SUPPLIER'}
          </span>
        }
        open={isModalOpen}
        okText={editSupplierModal ? 'Update' : 'Add'}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: supplierModalLoading }}
        onCancel={() => {
          if (
            form.getFieldValue('name') === undefined ||
            form.getFieldValue('name') === null ||
            form.getFieldValue('name') === ''
          ) {
            setIsModalOpen(false)
            form.resetFields()
          } else {
            setIsCloseWarning(true) // Assuming you have this state handler for close warning
          }
        }}
      >
        <Spin spinning={supplierModalLoading}>
          <Form
            onFinish={editSupplierModal ? updateSupllierMt : createNewSupplier}
            form={form}
            layout="vertical"
          >
            <Form.Item
              className="mb-2"
              name="name"
              label="Name"
              rules={[{ required: true, message: false }]}
            >
              <Input className="w-full" placeholder="Enter the Supplier Name" />
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
              <InputNumber
                type="number"
                className="w-full"
                min={0}
                placeholder="Enter the Mobile Number"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="address"
              label="Address"
              rules={[{ required: true, message: false }]}
            >
              <TextArea rows={2} placeholder="Enter the Address" />
            </Form.Item>

            <Form.Item label="Material" className="mb-14">
              <Form.List name="material">
                {(fields, { add, remove }) => (
                  <div className={`w-full overflow-y-scroll h-[200px] custom-scroll pr-4`}>
                    {fields.map(({ key, name, ...restField }) => (
                      <span key={key} className="flex items-center gap-x-2 relative ">
                        {/* <span className='text-[0.8rem] w-[20px]'>{key +1}.</span> */}
                        {/* Input field for Material Name */}
                        <Form.Item
                          className="w-[69%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'name']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Input placeholder="Material Name" />
                        </Form.Item>

                        {/* Select for Units */}
                        <Form.Item
                          className="w-[23%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'unit']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Select
                            placeholder="Unit"
                            allowClear
                            // optionFilterProp="label"
                            options={[
                              { label: 'GM', value: 'gm' },
                              { label: 'KG', value: 'kg' },
                              { label: 'LT', value: 'lt' },
                              { label: 'ML', value: 'ml' },
                              { label: 'Box', value: 'box' },
                              { label: 'Piece', value: 'piece' }
                            ]}
                          />
                        </Form.Item>

                        <MinusCircleOutlined
                          className="absolute top-[40%] right-1 -translate-y-1/2"
                          onClick={() => remove(name)}
                        />
                      </span>
                    ))}
                    <Form.Item className="absolute w-full -bottom-16">
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Material
                      </Button>
                    </Form.Item>
                  </div>
                )}
              </Form.List>
            </Form.Item>

            {/* <Form.Item
              className="mb-2"
              name="gender"
              label="Gender"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group>
                <Radio value={'Male'}>Male</Radio>
                <Radio value={'Female'}>Female</Radio>
              </Radio.Group>
            </Form.Item> */}
          </Form>
        </Spin>
      </Modal>

      <Modal
        centered={true}
        maskClosable={
          amountOnchangeValue === '' ||
          amountOnchangeValue === null ||
          amountOnchangeValue === undefined
            ? true
            : false
        }
        title={
          <div className="flex  justify-center py-3">
            <h1 className="text-xl font-bold">{supplierName}</h1>
          </div>
        }
        open={isPayModelOpen}
        onCancel={() => {
          if (
            amountOnchangeValue === '' ||
            amountOnchangeValue === null ||
            amountOnchangeValue === undefined
          ) {
            setIsPayModelOpen(false)
            setSupplierOnchangeValue('')
          } else {
            setIsCloseWarning(true)
          }
        }}
        okButtonProps={{ disabled: payModalLoading }}
        onOk={() => payForm.submit()}
      >
        <Spin className="relative" spinning={payModalLoading}>
          <Form
            onFinish={supplierPay}
            form={payForm}
            initialValues={{ date: dayjs(), paymentMode: 'Cash' }}
            layout="vertical"
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
              rules={[{ required: true, message: false }]}
              className="mb-1"
              name="amount"
              label="Amount"
            >
              <InputNumber
                onChange={(e) => amountOnchange(e)}
                min={0}
                className="w-full"
                type="number"
                placeholder="Enter the Amount"
              />
            </Form.Item>
            <Form.Item className="mb-1" name="decription" label="Description">
              <TextArea rows={4} placeholder="Write the Description" />
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
          <div className="text-center w-full block pb-5">
            <Tag color="blue" className={`absolute left-14`}>
              {supplierName}
            </Tag>
            <span>PAY DETAILS</span>
          </div>
        }
        open={isPayDetailsModelOpen}
        footer={null}
        width={1200}
        onCancel={() => {
          setIsPayDetailsModelOpen(false)
        }}
      >
        <Table
          virtual
          pagination={false}
          columns={payDetailsColumns}
          dataSource={payDetailsData}
          rowKey="id"
          scroll={{ y: historyHeight }}
        />
        <div className="flex justify-between mt-2 font-semibold">
          <div>Purchase: {totalPurchaseAmount.toFixed(2)}</div>
          <div>Payment: {totalPaymentAmount.toFixed(2)}</div>
          <div>Balance: {totalBalanceAmount.toFixed(2)}</div>
        </div>
      </Modal>

      <Modal
        title={<span className="block text-center">New Material</span>}
        onOk={() => materialForm.submit()}
        okText="Add"
        centered
        open={addNewMaterial.modal}
        onCancel={() => {
          materialForm.resetFields()
          setAddNewMaterial((pre) => ({ ...pre, modal: false }))
        }}
      >
        <Spin spinning={addNewMaterial.spin}>
          <Form form={materialForm} layout="vertical" onFinish={addNewMaterialMt}>
            <Form.Item label="Material" className="mb-0">
              <Form.List name="material">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex items-center gap-x-2 relative">
                        {/* Input field for Material Name */}
                        <Form.Item
                          className="w-[70%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'materialname']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Input
                            onChange={() => setAddNewMaterial((pre) => ({}))}
                            placeholder="Material Name"
                          />
                        </Form.Item>

                        {/* Select for Units */}
                        <Form.Item
                          className="w-[23%] mb-[0.4rem]"
                          {...restField}
                          name={[name, 'unit']}
                          rules={[
                            {
                              required: true,
                              message: true
                            }
                          ]}
                        >
                          <Select
                            placeholder="Units"
                            onChange={(value) => console.log(value)}
                            options={[
                              { label: 'GM', value: 'gm' },
                              { label: 'KG', value: 'kg' },
                              { label: 'LT', value: 'lt' },
                              { label: 'ML', value: 'ml' },
                              { label: 'Box', value: 'box' },
                              { label: 'Piece', value: 'piece' }
                            ]}
                          />
                        </Form.Item>

                        <MinusCircleOutlined
                          className="absolute top-[40%] right-1 -translate-y-1/2"
                          onClick={() => remove(name)}
                        />
                      </div>
                    ))}
                    <Form.Item>
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Material
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}
