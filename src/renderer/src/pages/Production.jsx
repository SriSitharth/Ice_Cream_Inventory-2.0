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
  Spin
} from 'antd'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { TimestampJs } from '../js-files/time-stamp'
const { Search } = Input
const { RangePicker } = DatePicker
import dayjs from 'dayjs'
import { createProduction, updateProduction } from '../firebase/data-tables/production'
import jsonToExcel from '../js-files/json-to-excel'
import { updateStorage } from '../firebase/data-tables/storage'
import { getProductById } from '../firebase/data-tables/products'
import { PiWarningCircleFill } from 'react-icons/pi'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { chunk, debounce } from 'lodash'
export default function Production({ datas, productionUpdateMt, storageUpdateMt }) {
  const [form] = Form.useForm()
  const [form2] = Form.useForm()
  const [form3]= Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKey, setEditingKey] = useState('')
  const [data, setData] = useState([])
  const [dateRange, setDateRange] = useState([null, null])
  const [isProductionTbLoading, setIsProductionTbLoading] = useState(true)
  const [offset, setOffset] = useState(0);
  const chunkSize = 25;

  // side effect
  useEffect(() => {
    const fetchData = async () => {
      setIsProductionTbLoading(true)
      const filteredProductions = await Promise.all(
        datas.productions
          .filter((data) => !data.isdeleted && isWithinRange(data.date))
          .slice(offset, offset + chunkSize)
          .map(async (item, index) => {
            const result = await getProductById(item.productid)
            const productname = result.status === 200 ? result.product.productname : 'a'
            const flavour = result.status === 200 ? result.product.flavour : 'a'
            const quantity = result.status === 200 ? result.product.quantity : 'a'
            return {
              ...item,
              sno: offset + index + 1,
              key: item.id || index,
              productname: productname,
              flavour: flavour,
              quantity: quantity
            }
          })
      )
      setData((prevData) => (offset === 0 ? filteredProductions : [...prevData, ...filteredProductions]))
      setIsProductionTbLoading(false)
    }
    fetchData()
  }, [datas.productions, dateRange,offset])

  useEffect(() => {
    setOffset(0);
    setData([]);
  }, [datas.productions,dateRange]);

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
    setSearchText(value)
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
          String(record.date).toLowerCase().includes(value.toLowerCase()) ||
          String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          String(record.numberofpacks).toLowerCase().includes(value.toLowerCase())
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
      editable: false,
      width: 115
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname',
      editable: false
    },
    // {
    //   title: 'Flavor',
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   editable: false
    // },
    // {
    //   title: 'Quantity',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   editable: false,
    //   width: 120
    // },
    {
      title: 'Packs',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: true,
      width: 130
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
            <Popconfirm
            placement='left'
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
        await updateProduction(key.id, {
          numberofpacks: row.numberofpacks,
          updateddate: TimestampJs()
        })
        await productionUpdateMt()
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
    await updateProduction(id, { isdeleted: true, deleteddate: TimestampJs() })
    productionUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  }

  const columns2 = [
    {
      title: <span className="text-[0.7rem]">S.No</span>,
      editable: false,
      render:(text,record,i)=> <span className="text-[0.7rem]">{i+1}</span>,
      width:65
    },
    {
      title: <span className="text-[0.7rem]">Product</span>,
      dataIndex: 'productname',
      key: 'productname',
      editable: false,
      render:(text)=> <span className="text-[0.7rem]">{text}</span>
    },
    // {
    //   title: 'Flavor',
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   editable: false
    // },
    // {
    //   title: 'Quantity',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   editable: false
    //   //width: 120
    // },
    {
      title: <span className="text-[0.7rem]">Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      editable: true,
      render:(text)=> <span className="text-[0.7rem]">{text}</span>,
      width: 120
    },
    {
      title: <span className="text-[0.7rem]">Action</span>,
      dataIndex: 'operation',
      fixed: 'right',
      width: 80,
      render: (_, record) => {
        const editable = temisEditing(record)
        return !editable ? (
          <span className="flex gap-x-2">
            <MdOutlineModeEditOutline
              className={` ${editingKey !== '' ?'text-gray-400 cursor-not-allowed' : 'text-blue-500 cursor-pointer'}`}
              size={19}
              onClick={() => editingKey !== '' ? console.log('') : temedit(record)}
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
            <Typography.Link style={{ marginRight: 8 }} onClick={() => temsave(record)}>
              <LuSave size={17} />
            </Typography.Link>

            <Popconfirm
              title="Sure to cancel?"
              onConfirm={temcancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
        // return (
        //   <Popconfirm
        //     className={`${editingKey !== '' ? 'cursor-not-allowed' : 'cursor-pointer'} `}
        //     title="Sure to delete?"
        //     onConfirm={() => removeTemProduct(record)}
        //     disabled={editingKey !== ''}
        //   >
        //     <AiOutlineDelete
        //       className={`${editingKey !== '' ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 cursor-pointer hover:text-red-400'}`}
        //       size={19}
        //     />
        //   </Popconfirm>
        // )
      }
    }
  ];

 

  const [option, setOption] = useState({
    flavour: [],
    flavourstatus: true,
    product: [],
    productvalue: '',
    quantity: [],
    quantitystatus: true,
    tempproduct: []
  });


  const temEditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = inputType === 'number' ? <InputNumber className='text-[0.8rem]' size='small'/> : <Input />
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
  const temisEditing = (record) => record.key === editingKey
 
  const temedit = (record) => {
    form3.setFieldsValue({ ...record })
    setEditingKey(record.key)
  }

  const temmergedColumns = columns2.map((col) => {
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
        editing: temisEditing(record)
      })
    }
  })
  const temcancel = () => {
    setEditingKey('')
  }

  //update method
  const temsave = async (key) => {
    try {
      const row = await form3.validateFields()
      const newData = [...option.tempproduct]
      const index = newData.findIndex((item) => key.id === item.key)
      if (index != null && row.numberofpacks === key.numberofpacks) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKey('')
      } else {
        let updateData = newData.map(data => data.key === key.key ? {...data,numberofpacks:row.numberofpacks} : data );
        setOption(pre=>({...pre,tempproduct:updateData}))
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKey('')
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo)
    }
  }

  //product initial value
  useEffect(() => {
    const productOp = datas.product
      .filter((item, i, s) =>
       item.isdeleted === false)
      //  && s.findIndex((item2) => item2.productname === item.productname))
       .map((data) => ({ label: data.productname, value: data.productname }));
      
      setOption((pre) => ({ ...pre, product: productOp  }))
  }, []);

  //product onchange value
  const productOnchange = debounce(async (value, i) => {
    form2.resetFields(['flavour'])
    form2.resetFields(['quantity'])
    // form2.resetFields(['numberofpacks'])
    // const flavourOp = await Array.from(
    //   new Set(
    //     datas.product
    //       .filter((item) => item.isdeleted === false && item.productname === value)
    //       .map((data) => data.flavour))).map((flavour) => ({ label: flavour, value: flavour }));
   
          setOption((pre) => ({
      ...pre,
      flavourstatus: false,
      // flavour: flavourOp,
      productvalue: value,
      quantitystatus: true
    }))
  },300)

  //flavour onchange value
  const flavourOnchange = async (value, i) => {
    form2.resetFields(['quantity'])
    form2.resetFields(['numberofpacks'])
    const quantityOp = Array.from(
      new Set(
        datas.product.filter(
          (item) =>
            item.isdeleted === false &&
            item.flavour === value &&
            item.productname === option.productvalue
        ))).map((q) => ({ label: q.quantity + ' ' + q.unit, value: q.quantity + ' ' + q.unit }))
    setOption((pre) => ({ ...pre, quantitystatus: false, quantity: quantityOp }))
  }

  // create add tem product
  const [count, setCount] = useState(0)
  const createTemProduction = async (values) => {
    setCount(count + 1)
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const newProduct = { ...values, key: count, date: formattedDate, createddate: TimestampJs() }
    const checkExsit = option.tempproduct.some(
      (item) =>
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.numberofpacks === newProduct.numberofpacks &&
        item.date === newProduct.date
    )
    const checkSamePacks = option.tempproduct.some(
      (item) =>
        item.productname === newProduct.productname &&
        item.flavour === newProduct.flavour &&
        item.quantity === newProduct.quantity &&
        item.numberofpacks !== newProduct.numberofpacks &&
        item.date === newProduct.date &&
        item.key !== newProduct.key
    )
    const temVales = { ...values, date: formattedDate }
    const dbCheck = datas.productions.some(
      (item) =>
        item.productname === temVales.productname &&
        item.flavour === temVales.flavour &&
        item.quantity === temVales.quantity &&
        item.date === temVales.date
    )
    if (checkExsit) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (checkSamePacks) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else if (dbCheck) {
      message.open({ type: 'warning', content: 'Product is already added' })
      return
    } else {
      setOption((pre) => ({ ...pre, tempproduct: [...pre.tempproduct, newProduct] }))
    }
  }

  // remove temp product
  const removeTemProduct = (key) => {
    const newTempProduct = option.tempproduct.filter((item) => item.key !== key.key)
    setOption((pre) => ({ ...pre, tempproduct: newTempProduct }))
  }

  const [isAddProductModal, setIsAddProductModal] = useState(false)
  // add new production
  const addNewProduction = async () => {
  
   setIsAddProductModal(true)
    try {
      for (const item of option.tempproduct) {
        let { key, quantity, ...newProduction } = item
        
        // let quantityNumber = Number(quantity.split(' ')[0])
        
        const existingProductList = datas.product.find((productItem) => productItem.productname === newProduction.productname && productItem.isdeleted === false
        // && productItem.flavour === newProduction.flavour &&  productItem.quantity === quantityNumber 
      )
        
        await createProduction({
          date: newProduction.date,
          createddate: newProduction.createddate,
          productid: existingProductList.id,
          isdeleted: false,
          numberofpacks: newProduction.numberofpacks
        });
        
        const existingProduct = datas.storage.find((storageItem) => storageItem.productid === existingProductList.id  && storageItem.category === 'Product List' )
        
        console.log(existingProduct);
        // setIsAddProductModal(false)
        await updateStorage(existingProduct.id, {
          numberofpacks: existingProduct.numberofpacks + newProduction.numberofpacks,
          updateddate:TimestampJs()
        })
      }
      message.open({ type: 'success', content: 'Production added successfully' })
      setIsModalOpen(false)
      await productionUpdateMt();
      await storageUpdateMt();
      form2.resetFields()
      setOption((pre) => ({
        ...pre,
        tempproduct: [],
        flavour: [],
        flavourstatus: true,
        quantity: [],
        quantitystatus: true
      }))
      setCount(0)
    } catch (e) {
      message.open({type:'error',content: `${e} An error occurred while adding new production`})
      console.error('An error occurred while adding new production:', e)
    } finally {
     setIsAddProductModal(false);
    }
  }

  const modelCancel = () => {
    if (option.tempproduct.length > 0) {
      setIsCloseWarning(true)
    } else {
      setIsModalOpen(false)
      form2.resetFields()
      setOption((pre) => ({
        ...pre,
        tempproduct: [],
        flavour: [],
        flavourstatus: true,
        quantity: [],
        quantitystatus: true
      }))
      setCount(0)
      setEditingKey('')
    }
  }

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const specificData = exportDatas.map((item, index) => ({
      No: index + 1,
      Date: item.date,
      Name: item.productname,
      Packs: item.numberofpacks,
    }));
    jsonToExcel(specificData, `Production-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKey('')
  }

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

  const [isCloseWarning, setIsCloseWarning] = useState(false)

  const warningModalOk = () => {
    setIsCloseWarning(false)
    setIsModalOpen(false)
    form2.resetFields()
    setOption((pre) => ({
      ...pre,
      tempproduct: [],
      flavour: [],
      flavourstatus: true,
      quantity: [],
      quantitystatus: true
    }))
    setCount(0)
    setEditingKey('')
  };


  const [freezerBoxHeight, setFreezerBoxHeight] = useState(window.innerHeight - 200) // Initial height adjustment
  useEffect(() => {
    // Function to calculate and update table height
    const updateTableHeight = () => {
      const newHeight = window.innerHeight - 500 // Adjust this value based on your layout needs
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
            <RangePicker
              className="w-[16rem]"
              format="DD/MM/YYYY"
              onChange={(dates) => setDateRange(dates)}
            />
            <Button onClick={exportExcel} disabled={selectedRowKeys.length === 0}>
              Export <PiExport />
            </Button>
            <Button
              disabled={editingKey !== ''}
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                form.resetFields()
              }}
            >
              Add Product <IoMdAdd />
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
              loading={isProductionTbLoading}
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
        className="relative"
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h2>ADD PRODUCT</h2>{' '}
          </div>
        }
        centered={true}
        width={1000}
        open={isModalOpen}
        // onOk={addNewProduction}
        onCancel={modelCancel}
        okButtonProps={{ disabled: true }}
        footer={
          <Button
            type="primary"
            disabled={option.tempproduct.length > 0 && !isAddProductModal ? false : true}
            onClick={addNewProduction}
            className=" w-fit"
          >
            Add
          </Button>
        }
      >
        <Spin spinning={isAddProductModal}>
          <div className="grid grid-cols-4 gap-x-3">
            <span className="col-span-1 ">
              <Form
                onFinish={createTemProduction}
                form={form2}
                layout="vertical"
                initialValues={{ date: dayjs() }}
              >
               <Form.Item
                  className=" absolute top-[-2.8rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
                </Form.Item>

                <div >
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
                  className="mt-7"
                  name="numberofpacks"
                  label="Number of Pieces"
                  rules={[{ required: true, message: false }]}
                >
                  <InputNumber
                    min={0}
                    type="number"
                    className="w-full"
                    placeholder="Enter the Number"
                  />
                </Form.Item>

               

                {/* <div 
                // className="mb-3 w-full"
                > */}
                  <Button className="w-full mt-4" type="primary" htmlType="submit">
                    Add To List
                  </Button>
                {/* </div> */}
              </div>
              </Form>
            </span>
            <span className="col-span-3">
            <Form form={form3} component={false}>
              <Table
                virtual
                components={{
                body: {
                  cell: temEditableCell
                }
              }}
                className="w-full"
                columns={temmergedColumns}
                dataSource={option.tempproduct}
                // pagination={{ pageSize: 4 }}
                pagination={false} 
                scroll={{  y: freezerBoxHeight }}
              />
              </Form>
            </span>
          </div>
        </Spin>
      </Modal>
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
    </div>
  )
}
