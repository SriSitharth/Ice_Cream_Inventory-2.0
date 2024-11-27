import React, { useEffect, useRef, useState } from 'react'
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
  Spin,
  Dropdown,
  Menu
} from 'antd'
import { debounce } from 'lodash'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { createproduct, updateproduct } from '../firebase/data-tables/products'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import { createStorage, updateStorage } from '../firebase/data-tables/storage'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { PiWarningCircleFill } from 'react-icons/pi'
import { DatestampJs } from '../js-files/date-stamp'
import companyLogo from '../assets/img/companylogo.png'
import { generatPDF } from '../js-files/pdf-generator'
// import loadingGif from '../assets/Loopy-ezgif.com-gif-maker.gif'
// import loadingGif from '../assets/Dessertanyone_Steemit-ezgif.com-effects.gif'
import loadingGif from '../assets/Dessertanyone_Steemit-ezgif.com-effects.gif'
import { formatName } from '../js-files/letter-or-name'

const { Search } = Input

export default function Product({ datas, productUpdateMt, storageUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [productTbLoading, setProductTbLoading] = useState(true)

  // side effect
  useEffect(() => {
    setProductTbLoading(true)
    const filteredData = datas.product
      .filter((data) => data.isdeleted === false)
      .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    setData(filteredData)
    setProductTbLoading(false)
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

  const [isProductLoading, setIsProductLoading] = useState(false)
  // create new project
  const createNewProduct = async (values) => {
  
    
    try {
      const productExists = datas.product.some((product) => (product.productname === values.productname  || product.productname === formatName(values.productname)) && product.isdeleted === false
          // && product.flavour === values.flavour &&
          // product.quantity === values.quantity
          );

      // const storageExists = datas.storage.filter(prfound => datas.product.filter(pr => pr.id === prfound.productid && pr.productname === formatName(values.productname)));
      const storageExists = datas.storage.some(prfound => datas.product.some(pr =>  (pr.id === prfound.productid) && (pr.productname === formatName(values.productname)) && (prfound.isdeleted === false) && (pr.isdeleted === false)));
      


  if(productExists){
    return message.open({content:'This name was already exsits',type:'info'})
  }
  else{
    console.log({
      ...values,
      productname: formatName(values.productname),
      // flavour: formatName(values.flavour),
      flavour: '',
      unit:'',
      quantity:'',
      createddate: TimestampJs(),
      updateddate: '',
      isdeleted: false
    });
    console.log(storageExists);
    
    setIsProductLoading(true)
    const productRef = await createproduct({
      ...values,
      productname: formatName(values.productname),
      // flavour: formatName(values.flavour),
      flavour: '',
      unit:'',
      quantity:'',
      createddate: TimestampJs(),
      updateddate: '',
      isdeleted: false
    });
    const productId = productRef.res.id
    console.log(productId, productRef)
    
    if (storageExists === false ) {
      await createStorage({
        // productname: formatName(values.productname),
        // flavour: formatName(values.flavour),
        // quantity: values.quantity,
        // unit: values.unit,
        //productperpack: values.productperpack,
        productid: productId,
        alertcount: 0,
        numberofpacks: 0,
        category: 'Product List',
        createddate: TimestampJs(),
        isdeleted:false
      })
      storageUpdateMt()
    }
    form.resetFields()
    await productUpdateMt()
    setIsProductLoading(false)
     setIsModalOpen(false)
     setProductOnchangeValue('')
     message.open({content:'Product Created Successfully',type:'success'})
 }
    } catch (e) {
      console.log(e)
      message.open({content:'Product Creation Failed',type:'error'})
    } 
  }

  const columns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 50,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
          // String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          // String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
          String(record.productperpack).toLowerCase().includes(value.toLowerCase()) ||
          String(record.price * record.productperpack).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity + ' ' + record.unit).toLowerCase().includes(value.toLowerCase())
        )
      }
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname',
      editable: true,
      sorter: (a, b) => a.productname.localeCompare(b.productname),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    // {
    //   title: 'Flavour',
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   editable: true,
    //   sorter: (a, b) => a.flavour.localeCompare(b.flavour),
    //   showSorterTooltip: { target: 'sorter-icon' }
    // },
    // {
    //   title: 'Quantity',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   editable: true,
    //   width: 130,
    //   render: (_, record) => {
    //     return record.quantity + ' ' + record.unit
    //   }
    // },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      editable: true,
      width: 150,
      sorter: (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (_, record) => {
        return <span>{formatToRupee(record.price, true)}</span>
      }
    },
    {
      title: 'Product Per Pack',
      dataIndex: 'productperpack',
      key: 'productperpack',
      editable: true,
      width: 149
    },
    {
      title: 'Pack Price',
      width: 150,
      key: 'packprice',
      render: (_, record) => (
        <span>{formatToRupee(record.price * record.productperpack, true)}</span>
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
            <Typography.Link
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => edit(record)}
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
                  <InputNumber className="w-full" type="number" />
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
                      { label: 'GM', value: 'gm' },
                      { label: 'KG', value: 'kg' },
                      { label: 'LT', value: 'lt' },
                      { label: 'ML', value: 'ml' },
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
    setEditingKeys([])
  }

  const save = async (key) => {
    try {
      const row = await form.validateFields()
      const newData = [...data]
      // const index = newData.findIndex((item) => key.id === item.key);
      // const checkName = data.some(data => data.productname === key.productname);
      // console.log(checkName);
      if (
        // index != null &&
        // row.flavour === key.flavour &&
        row.productname === key.productname &&
        // row.quantity === key.quantity &&
        row.productperpack === key.productperpack &&
        row.price === key.price 
        // && (key.productname === formatName(row.productname))
        // && row.unit === key.unit
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([]);
      } 
      else {
        setProductTbLoading(true)
        setEditingKeys([]);
        await updateproduct(key.id, { ...row,productname:formatName(row.productname), updateddate: TimestampJs() });
        productUpdateMt();
        message.open({ type: 'success', content: 'Updated Successfully' });
        setProductTbLoading(false)
      }
    } catch (errInfo) {
      console.log('Validate Failed:', errInfo);
    }
  };

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
  }, []);

  // delete
  const deleteProduct = async (data) => {
    // await deleteproduct(data.id);
    const { id, ...newData } = data;
   
    let storageProduct = datas.storage.find(pr => pr.productid === id);
   
    await updateproduct(id, {isdeleted: true, // deletedby: 'admin', 
      deleteddate: TimestampJs()
    });
    await updateStorage(storageProduct.id,{isdeleted:true,updateddate: TimestampJs()})
    
   await storageUpdateMt()
   await productUpdateMt()
    message.open({ type: 'success', content: 'Deleted Successfully' })
  };

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const excelDatas = exportDatas.map((pr, i) => ({
      sno: i + 1,
      product: pr.productname,
      // flavour: pr.flavour,
      // size: pr.quantity + ' ' + pr.unit,
      rate: pr.price,
      qty: pr.productperpack,
      packprice: pr.productperpack * pr.price
    }))

    jsonToExcel(excelDatas, `Product-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    // setEditingKey('')
  };

  const pdfRef = useRef()
  const [pdf, setPdf] = useState({
    data: [],
    isGenerate: false,
    name: `Product List ${DatestampJs()}`
  })
  const items = [
    {
      key: '1',
      label: (
        <span onClick={() => exportPdf('gst')} className="w-full text-[0.7rem] m-0 block">
          PDF(.pdf)
        </span>
      )
    },
    // {
    //   key: '2',
    //   label: <span onClick={()=> exportPdf('withoutgst')} className='w-full text-[0.7rem] m-0'>Without GST</span>,
    // },
    {
      key: '2',
      label: (
        <span className="w-full text-[0.7rem] m-0 block" onClick={exportExcel}>
          Excel(.xlsx)
        </span>
      )
    }
  ]
  const menu = <Menu items={items} />
  const exportPdf = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    setPdf((pre) => ({ ...pre, data: exportDatas, isGenerate: true }))
    await generatPDF(pdfRef, pdf.name)
    setSelectedRowKeys([])
  }

  // useEffect( ()=>{
  // const pdfOperation = async ()=>{
  //   if(pdf.isGenerate === true){
  //    await generatPDF(pdfRef,pdf.name);
  //     await setPdf(pre=>({...pre,isGenerate:false}))
  //   }
  // }
  // pdfOperation();
  // },[pdf.isGenerate]);

  const [productOnchangeValue, setProductOnchangeValue] = useState('')
  const productOnchange = debounce((value) => {
    setProductOnchangeValue(value)
  },500)

  const [isCloseWarning, setIsCloseWarning] = useState(false)

  const warningModalOk = () => {
    setIsCloseWarning(false)
    setIsModalOpen(false)
    form.resetFields()
    setProductOnchangeValue('')
  }

  return (
    <div className="relative">
      <div
        ref={pdfRef}
        className="absolute top-[-200rem] w-[75%] mx-auto mt-0"
        style={{ backgroundColor: '#ffff' }}
      >
        <section className="w-[100%] mx-auto mt-0">
          <ul className="flex justify-center items-center gap-x-5">
            <li>
              {' '}
              <img className="w-[6rem]" src={companyLogo} alt="comapanylogo" />{' '}
            </li>
            <li className="text-center">
              {' '}
              <h1 className="text-xl font-bold">NEW SARANYA ICE COMPANY</h1>{' '}
              <p>PILAVILAI, AZHAGANPARAI P.O.</p> <p>K.K.DIST</p>{' '}
            </li>
          </ul>

          <ul className="mt-5 flex justify-between">
            <li>
              {/* <div className={`${pdf.gst ? 'block': 'hidden'}`}>
                <span className="font-bold">GSTIN:</span> 33AAIFN6367K1ZV
              </div> */}
              <div>
                {' '}
                <span className="font-bold">Date:</span> <span>{TimestampJs().split(',')[0]}</span>
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

          {/* <h1 className="font-bold  text-center text-lg">Invoice</h1> */}
          <table className="min-w-full border-collapse mt-4">
            <thead>
              <tr>
                <th className="p-1 text-left border-b">S.No</th>
                <th className="p-1 border-b text-left">Product</th>
                {/* <th className="p-1 border-b text-left">Flavour</th>
                <th className="p-1 border-b text-left">Size</th> */}
                <th className="p-1 border-b text-left">Price</th>
                {/* <th className="p-1 border-b text-center">Qty</th>
                <th className="p-1 border-b text-center">Pack Price</th> */}
              </tr>
            </thead>
            <tbody>
              {pdf.data.length > 0
                ? pdf.data.map((item, i) => (
                    <tr key={i}>
                      <td className="p-1 border-b">{i + 1}</td>
                      <td className="p-1 border-b">{item.productname}</td>
                      {/* <td className="p-1 border-b">{item.flavour}</td>
                      <td className="p-1 border-b">{item.quantity + item.unit}</td> */}
                      <td className="p-1 border-b">{item.price}</td>
                      {/* <td className="p-1 border-b">{item.productperpack}</td>
                      <td className="p-4 border-b">{item.productperpack * item.price}</td> */}
                    </tr>
                  ))
                : 'No Data'}
            </tbody>
          </table>
        </section>
      </div>

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
            {/* <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0}
              onClick={exportExcel}
            >
              Export <PiExport />
            </Button> */}
            {/* <Popconfirm disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0} title="Sure to cancel?" onConfirm={()=>exportExcel('GST')} onCancel={exportExcel}>
            <Button disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0}>Export <PiExport /></Button>
            </Popconfirm> */}
            <Dropdown
              disabled={editingKeys.length !== 0 || selectedRowKeys.length === 0}
              overlay={menu}
              placement="bottom"
            >
              <Button>
                Export <PiExport />
              </Button>
            </Dropdown>

            <Button
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              type="primary"
              onClick={() => {
                setIsModalOpen(true)
                form.resetFields()
                setProductOnchangeValue('')
              }}
            >
              New Product <IoMdAdd />
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
              loading={{
                spinning: productTbLoading,
                // productTbLoading,
                // indicator: (
                //   <Spin indicator={<img className="opacity-80" src={loadingGif} alt="loading" />} />
                // )
              }}
              rowClassName="editable-row"
              scroll={{ x: 900, y: tableHeight }}
              rowSelection={rowSelection}
            />
          </Form>
        </li>
      </ul>

      <Modal
        centered={true}
        maskClosable={
          productOnchangeValue === '' ||
          productOnchangeValue === undefined ||
          productOnchangeValue === null
            ? true
            : false
        }
        title={<span className="flex justify-center">NEW PRODUCT</span>}
        open={isModalOpen}
        onOk={() => form.submit()}
        okButtonProps={{ disabled: isProductLoading }}
        onCancel={() => {
          if (
            productOnchangeValue === '' ||
            productOnchangeValue === undefined ||
            productOnchangeValue === null
          ) {
            setIsModalOpen(false)
            form.resetFields()
          } else {
            setIsCloseWarning(true)
          }
        }}
      >
        <Spin spinning={isProductLoading}>
          <Form onFinish={createNewProduct} form={form} layout="vertical">
            <Form.Item
              className="mb-2"
              name="productname"
              label="Name"
              rules={[{ required: true, message: false }]}
            >
              <Input
                onChange={(e) => productOnchange(e.target.value)}
                placeholder="Enter the Product Name"
              />
            </Form.Item>
 {/*
            <Form.Item
              className="mb-2"
              name="flavour"
              label="Flavour Name"
              rules={[{ required: true, message: false }]}
            >
              <Input placeholder="Enter the Flavour Name" />
            </Form.Item>

            <span className="flex gap-x-2">
              <Form.Item
                className="mb-2 w-full"
                name="quantity"
                label="Quantity"
                rules={[
                  { required: true, message: false },
                  { type: 'number', message: false }
                ]}
              >
                <InputNumber className="w-full" type="number" placeholder="Enter the Quantity" />
              </Form.Item>

              <Form.Item
                className="mb-2"
                name="unit"
                label="Unit"
                rules={[{ required: true, message: false }]}
              >
                <Select
                  showSearch
                  placeholder="Select the Unit"
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    (optionA?.label ?? '')
                      .toLowerCase()
                      .localeCompare((optionB?.label ?? '').toLowerCase())
                  }
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
            </span>
            */}

            <Form.Item
              className="mb-2"
              name="price"
              label="Price"
              rules={[
                { required: true, message: false },
                { type: 'number', message: false }
              ]}
            >
              <InputNumber className="w-full" type="number" placeholder="Enter the Amount" />
            </Form.Item>
            
            <Form.Item
              className="mb-5"
              name="productperpack"
              label="Product Per Pack"
              rules={[
                { required: true, message: false },
                { type: 'number', message: false }
              ]}
            >
              <InputNumber className="w-full" type="number" placeholder="Enter the PPP" />
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}
