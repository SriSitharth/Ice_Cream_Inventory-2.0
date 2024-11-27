// src/components/NavBar.js
import React, { useEffect, useState, useRef } from 'react'
import IceCreamLogo from '../assets/img/logo.jpg'
// import IceCreamLogo from '../assets/img/hiddenlogo.jpg'
import { LiaHandHoldingUsdSolid } from 'react-icons/lia'
import { TbIceCream } from 'react-icons/tb'
import { Row, Col, Badge } from 'antd';
import {
  Modal,
  Button,
  Input,
  Form,
  InputNumber,
  Select,
  DatePicker,
  Table,
  Popconfirm,
  message,
  Tag,
  Radio,
  Typography,
  Spin,
  TimePicker
} from 'antd'
const { TextArea } = Input
import dayjs from 'dayjs'
import { AiOutlineDelete } from 'react-icons/ai'
import { addDoc, collection, count, doc } from 'firebase/firestore'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { TimestampJs } from '../js-files/time-stamp'
import { db } from '../firebase/firebase'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { PiGarageBold, PiWarningCircleFill } from 'react-icons/pi'
import { debounce } from 'lodash'
import { createSpending } from '../firebase/data-tables/spending'
import { updateStorage } from '../firebase/data-tables/storage'
import { customRound } from '../js-files/round-amount'
import '../components/css/NavBar.css'

export default function NavBar({
  navPages,
  setNavPages,
  datas,
  deliveryUpdateMt,
  storageUpdateMt,
  spendingUpdateMt,
}) {
  const [isQuickSale, setIsQuickSale] = useState({
    model: false,
    temdata: [],
    proption: [],
    flaveroption: [],
    quntityoption: [],
    flavervalue: '',
    flavourinputstatus: true,
    quantityinputstatus: true,
    count: 0,
    dataloading: true,
    total: 0,
    date: dayjs().format('DD/MM/YYYY'),
    margin: 0,
    billamount: 0,
    type: 'quick',
    marginstate: false,
    paymentmode: '',
    paymentstatus: 'Paid',
    customeroption: [],
    editingKeys: [],
    temtableedit: {
      margin: true,
      price: true
    },
    spinning: false
  })
  const [isSpinners, setIsSpinners] = useState(false)

  const [quickSaleForm] = Form.useForm()
  const [quickSaleForm2] = Form.useForm()
  const [quickSaleForm3] = Form.useForm()
  const [form] = Form.useForm()

  const [editingKey, setEditingKey] = useState('');
  const [qucikSaleTableEdiable,setQucikSaleTableEdiable] = useState({
    pieceprice:true,
    packs:true,
    margin:true,
    price:true
  })
  // tem table column
  const temTableCl = [
    {
      title: <span className="text-[0.7rem]">Product</span>,
      dataIndex: 'productname',
      key: 'productname',
      render: (text) => <span className="text-[0.7rem]">{text}</span>
    },
    // {
    //   title: <span className="text-[0.7rem]">Flavor</span>,
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   render: (text) => <span className="text-[0.7rem]">{text}</span>
    // },
    // {
    //   title: <span className="text-[0.7rem]">Quantity</span>,
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   render: (text) => <span className="text-[0.7rem]">{text}</span>
    // },
    {
      title: <span className="text-[0.7rem]">Piece Price</span>,
      dataIndex: 'productprice',
      key: 'productprice',
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      editable:qucikSaleTableEdiable.pieceprice,
      width:90
    },
    {
      title: <span className="text-[0.7rem]">Packs</span>,
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      editable:qucikSaleTableEdiable.packs,
      width:90
    },
    {
      title: <span className="text-[0.7rem]">MRP</span>,
      dataIndex: 'mrp',
      key: 'mrp',
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width:120
    },
    {
      title: <span className="text-[0.7rem]">Margin</span>,
      dataIndex: 'margin',
      key: 'margin',
      editable:qucikSaleTableEdiable.margin,
      render: (text) => <span className="text-[0.7rem]">{text}</span>,
      width:80
    },
    {
      title: <span className="text-[0.7rem]">Price</span>,
      dataIndex: 'price',
      key: 'price',
      render: (text) => <span className="text-[0.7rem]">{formatToRupee(text, true)}</span>,
      editable:qucikSaleTableEdiable.price,
      width:120
    },
    {
      title: <span className="text-[0.7rem]">Action</span>,
      width:90,
      dataIndex: 'operation',
      fixed: 'right',
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
              onConfirm={() => { setIsQuickSale((pre) => ({ ...pre, editingKeys: [] })); setFirstValue(null); setQucikSaleTableEdiable({ pieceprice:true, packs:true, margin:true, price:true})}}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        )
      }
    }
  ];

  useEffect(() => {
    const productData = datas.product
      .filter(
        (item, i, s) =>
          item.isdeleted === false 
        // &&  s.findIndex((item2) => item2.productname === item.productname) === i
      )
      .map((data) => ({ lable: data.productname, value: data.productname }))

    const customersData = datas.customers
      .filter((item) => item.isdeleted === false)
      .map((item) => ({ label: item.customername, value: item.customername }))
    setIsQuickSale((pre) => ({ ...pre, proption: productData, customeroption: customersData }))
  }, [isQuickSale.dataloading])

  const[productCount,setProductCount] = useState(0);
  const productOnchange = async (value) => {
    // const flavourData = await Array.from( new Set( datas.product
    //       .filter((item) => item.isdeleted === false && item.productname === value)
    //       .map((data) => data.flavour))).map((flavour) => ({ label: flavour, value: flavour }));
    let productid = datas.product.find(data => (data.productname === value) && (data.isdeleted === false)).id;
    let numberofpackCount = datas.storage.find(data => (data.productid === productid) && data.isdeleted === false ).numberofpacks;
    setProductCount(numberofpackCount);
    setIsQuickSale((pre) => ({
      ...pre,
      // flaveroption: flavourData,
      flavervalue: value,
      flavourinputstatus: false,
      quantityinputstatus: true
    }));
    quickSaleForm.resetFields(['quantity']);
    quickSaleForm.resetFields(['flavour']);
    quickSaleForm.resetFields(['numberofpacks']);
  };

  const flavourOnchange = async (value) => {
    const quantityData = Array.from(
      new Set(
        datas.product.filter(
          (item) =>
            item.isdeleted === false &&
            item.flavour === value &&
            item.productname === isQuickSale.flavervalue
        )
      )
    ).map((q) => ({ label: q.quantity + ' ' + q.unit, value: q.quantity + ' ' + q.unit }))
    setIsQuickSale((pre) => ({ ...pre, quntityoption: quantityData, quantityinputstatus: false }))
    quickSaleForm.resetFields(['quantity'])
    quickSaleForm.resetFields(['numberofpacks'])
  }

  const QuickSaleTemAdd = async (values, i) => {
    // console.log(Number(values.quantity.split(' ')[0]))
    let existingDataCheck = isQuickSale.temdata.filter( (item) =>
        item.productname === values.productname 
        // && item.flavour === values.flavour &&
        // item.quantity === values.quantity
    )
    if (existingDataCheck.length > 0) {
      return message.open({
        type: 'warning',
        content: 'This product is already existing in the list'
      })
    }

    setIsQuickSale((pre) => ({ ...pre, count: isQuickSale.count + 1 }))
    const formattedDate = values.date ? values.date.format('DD/MM/YYYY') : ''
    const inputDatas = {
      ...values,
      date: formattedDate,
      sno: isQuickSale.count,
      // quantity: Number(values.quantity.split(' ')[0]),
      // unit: values.quantity.split(' ')[1],
      quantity: '',
      unit: ''
    }

    const temdata = datas.product.filter(
        (pr) =>
          pr.productname === inputDatas.productname &&
          pr.isdeleted === false 
          // && pr.flavour === inputDatas.flavour &&
          // pr.quantity === inputDatas.quantity &&
          // pr.unit === inputDatas.unit
        ).map((data) => ({
        ...data,
        numberofpacks: inputDatas.numberofpacks,
        quantity: values.quantity,
        sno: isQuickSale.count,
        mrp: values.numberofpacks * data.price,
        margin: 0,
        productprice: data.price,
        price: values.numberofpacks * data.price,
        key: isQuickSale.count}));

    // setIsQuickSale((pre) => ({ ...pre, temdata: [...pre.temdata, ...temdata] }))
    
    const alltemdata = [...isQuickSale.temdata, ...temdata];
    const billamt = alltemdata.map(data => data.price).reduce((a,b)=> a + b,0);
    const totalMultiprTotalPr = alltemdata.reduce((acc, curr) => {
      return acc + (curr.mrp || 0)
    }, 0)
    setIsQuickSale((pre) => ({
      ...pre,
      total: totalMultiprTotalPr,
      billamount:billamt,
      marginstate: true,
      temdata: [...pre.temdata, ...temdata]
    }))
    quickSaleForm2.resetFields()
    quickSaleForm3.resetFields()
  }

  const removeTemProduct = (data) => {
    
    const deletedData = isQuickSale.temdata.filter((item) => item.sno !== data.sno)
    // setIsQuickSale((pre) => ({ ...pre, temdata: deletedData }))
    const totalMultiprTotalPr = deletedData.reduce((acc, curr) => { return acc + (curr.mrp || 0); }, 0);
    const billamt = deletedData.map(data => data.price).reduce((a,b)=> a + b,0);
    
    setIsQuickSale((pre) => ({
      ...pre,
      temdata: deletedData,
      total: totalMultiprTotalPr,
      billamount:billamt,
      marginstate: true,
      paymentstatus: pre.paymentstatus,
      paymentmode:'Cash',
    }));

    quickSaleForm2.resetFields()
    quickSaleForm3.resetFields()
  }

  const qickSaledateChange = (value) => {
    // quickSaleForm.resetFields(['productname'])
    // quickSaleForm.resetFields(['quantity'])
    // quickSaleForm.resetFields(['flavour'])
    // quickSaleForm.resetFields(['numberofpacks'])

    const isFutureDate = value && dayjs(value).isAfter(dayjs())

    quickSaleForm.setFieldsValue({
      type: isFutureDate ? 'booking' : 'quick'
    })

    setIsQuickSale((pre) => ({
      ...pre,
      // temdata: [],
      // count: 0,
      // total: 0,
      date: value === null ? '' : value.format('DD/MM/YYYY'),
      type: isFutureDate ? 'booking' : 'quick'
    }))
  }

  const quicksaleMt = async () => {
 
    // if(isQuickSale.type === 'booking'){
    // }
    // setIsQuickSale((pre) => ({ ...pre, model: false }))
    
    if(dayjs(quickSaleForm.getFieldsValue().date).format('DD/MM/YYYY') === 'Invalid Date'){
      return message.open({type:'info',content:"Please choose the correct date"})
    }
    
    let qickSaleForm3Value = quickSaleForm3.getFieldsValue()
    if (
      isQuickSale.type === 'booking' &&
      (qickSaleForm3Value.customername === '' ||
        qickSaleForm3Value.customername === undefined ||
        qickSaleForm3Value.customername === null ||
        (isQuickSale.paymentstatus === 'Partial' &&
          qickSaleForm3Value.partialamount === undefined) ||
        (isQuickSale.paymentstatus === 'Partial' && qickSaleForm3Value.partialamount === null) ||
        (isQuickSale.paymentstatus === 'Partial' && qickSaleForm3Value.partialamount === '') ||
        qickSaleForm3Value.mobilenumber === undefined ||
        qickSaleForm3Value.mobilenumber === null ||
        qickSaleForm3Value.mobilenumber === '' ||
        qickSaleForm3Value.time === undefined ||
        qickSaleForm3Value.time === null ||
        qickSaleForm3Value.time === '')
    ) {
      message.open({ type: 'warning', content: 'Please fill the required fields' })
      quickSaleForm3.submit()
      return
    } else if (
      isQuickSale.type === 'quick' &&
      isQuickSale.paymentstatus !== 'Paid' &&
      (qickSaleForm3Value.customername === '' ||
        qickSaleForm3Value.customername === undefined ||
        qickSaleForm3Value.customername === null ||
        qickSaleForm3Value.mobilenumber === undefined ||
        qickSaleForm3Value.mobilenumber === null ||
        qickSaleForm3Value.mobilenumber === '' ||
        (isQuickSale.paymentstatus === 'Partial' &&
          qickSaleForm3Value.partialamount === undefined) ||
        (isQuickSale.paymentstatus === 'Partial' && qickSaleForm3Value.partialamount === null) ||
        (isQuickSale.paymentstatus === 'Partial' && qickSaleForm3Value.partialamount === ''))
    ) {
      message.open({ type: 'warning', content: 'Please fill the required fields' })
      quickSaleForm3.submit()
      return
    } else {
      setIsSpinners(true)
      // setIsQuickSale(pre => ({...pre}))
      const productItems = isQuickSale.temdata.map((data, index) => ({
        id: data.id,
        numberofpacks: data.numberofpacks,
        margin: data.margin,
        productprice: data.productprice,
        sno: index + 1,
      }));
      // console.log(productItems);
      
      if (isQuickSale.type === 'quick') {
       
        productItems.map(async (data) => {
          const existingProduct = datas.storage.find(
            (storageItem) =>
              storageItem.productid === data.id && storageItem.category === 'Product List'
          )
          // console.log(existingProduct.id,{numberofpacks: existingProduct.numberofpacks - data.numberofpacks,updateddate:TimestampJs()});
          await updateStorage(existingProduct.id, {
            numberofpacks: existingProduct.numberofpacks - data.numberofpacks,
            updateddate: TimestampJs()
          })
        })
        await storageUpdateMt()
       
      }

      const newDelivery = {
        customername: qickSaleForm3Value.customername || 'Quick Sale',
        mobilenumber: qickSaleForm3Value.mobilenumber || '',
        billamount: isQuickSale.billamount,
        time: qickSaleForm3Value.time ? qickSaleForm3Value.time.format('HH:mm') : '',
        partialamount:
          qickSaleForm3Value.partialamount === undefined ||
          qickSaleForm3Value.partialamount === null
            ? 0
            : qickSaleForm3Value.partialamount,
        paymentstatus: qickSaleForm3Value.paymentstatus,
        total: isQuickSale.total,
        type: isQuickSale.type,
        bookingstatus: isQuickSale.type === "booking" ? "" : null,
        isdeleted: false,
        paymentmode: qickSaleForm3Value.paymentstatus === 'Unpaid' ? '' : isQuickSale.paymentmode,
        createddate: TimestampJs(),
        date: dayjs().format('DD/MM/YYYY'),
        deliverydate: dayjs(quickSaleForm.getFieldsValue().date).format('DD/MM/YYYY'),
        location: qickSaleForm3Value.location || ''
      }
      
      const paydetailsHistory = {
        amount:qickSaleForm3Value.partialamount === undefined ||
        qickSaleForm3Value.partialamount === null
          ? 0
          : qickSaleForm3Value.partialamount,
        createddate:TimestampJs(),
        date:dayjs().format('DD/MM/YYYY'),
        description:'',
        paymentmode:qickSaleForm3Value.paymentstatus === 'Unpaid' ? '' : isQuickSale.paymentmode,
        // collectiontype:'delivery',
        collectiontype:'firstpartial',
        type:'firstpartial',
        isdeleted:false
      }

      try {
        const deliveryCollectionRef = collection(db, 'delivery')
        const deliveryDocRef = await addDoc(deliveryCollectionRef, newDelivery)
        const itemsCollectionRef = collection(deliveryDocRef, 'items');
        const paydetailsHistoryRef = collection(deliveryDocRef, 'paydetails');

        if((isQuickSale.type === 'booking' || isQuickSale.type === 'quick') && isQuickSale.paymentstatus === 'Partial'){
          await addDoc(paydetailsHistoryRef, paydetailsHistory)
        }

        for (const item of productItems) {
          await addDoc(itemsCollectionRef, item)
        }
        message.open({ type: 'success', content: 'Production added successfully' })
        await deliveryUpdateMt()
        setIsQuickSale((pre) => ({
          ...pre,
          model: false,
          temdata: [],
          count: 0,
          total: 0,
          date: dayjs().format('DD/MM/YYYY'),
          margin: 0,
          billamount: 0,
          paymentmode: 'Cash',
          type: 'quick'
        }))
        quickSaleForm.resetFields()
        setIsSpinners(false)
      } catch (error) {
        console.log(error)
        setIsSpinners(false)
      }
    }

  }

  const marginMt = (value) => {
    let newData = isQuickSale.temdata.map((data) => ({
      ...data,
      margin: value.marginvalue,
      price: data.mrp - (data.mrp * value.marginvalue) / 100
    }));

    const totalAmounts =  newData.map(data => data.price).reduce((a,b)=> a + b ,0)
    const mrpAmount = newData.map(data => data.mrp).reduce((a, b) => a + b, 0)
        
    setIsQuickSale((pre) => ({
          ...pre,
          margin: value.marginvalue,
          billamount: totalAmounts,
          marginstate: true,
          temdata: newData,
          total:mrpAmount,
          paymentstatus:'Paid'
        }));
    

    // let marginCal = (isQuickSale.total * value.marginvalue) / 100
    // let marignAn = isQuickSale.total - marginCal

    // console.log(marginCal,marignAn);
    
    // let newData = isQuickSale.temdata.map((data) => ({
    //   ...data,
    //   margin: value.marginvalue,
    //   price: data.mrp - (data.mrp * value.marginvalue) / 100
    // }))
    
  }

  // const customerOnchange = (value)=>{
  //   console.log(value);
  // }

  // spending
  const [isSpendingModalOpen, setIsSpendingModalOpen] = useState({
    model: false,
    parentid: '',
    paytype: 'General',
    employeeoption: []
  })
  const [spendingForm] = Form.useForm()

  useEffect(() => {
    let employeeOtSet = datas.customers
      .filter((data) => data.isdeleted === false)
      .map((data) => ({ label: data.customername, value: data.id }))
    setIsSpendingModalOpen((pre) => ({ ...pre, employeeoption: employeeOtSet }))
  }, [!isSpendingModalOpen.model])

  // sepending method
  const handleSpendingFinish = async (values) => {
    const { empid, ...spendDatas } = values
    const customerSpendingData = {
      ...spendDatas,
      createddate: TimestampJs(),
      isdeleted: false,
      collectiontype: "customer",
      customerid: empid || null,
      type: "Spend",
      description:
        spendDatas.description === '' ||
        spendDatas.description === undefined ||
        spendDatas.description === null
          ? ''
          : spendDatas.description,
      date: dayjs(spendDatas.date).format('DD/MM/YYYY'),
    }
    const generalSpendingData = {
      ...spendDatas,
      createddate: TimestampJs(),
      isdeleted: false,
      description:
        spendDatas.description === '' ||
        spendDatas.description === undefined ||
        spendDatas.description === null
          ? ''
          : spendDatas.description,
      date: dayjs(spendDatas.date).format('DD/MM/YYYY'),
    }
    try {
      setSpendSpin(true)
      if (spendDatas.spendingtype === 'Customer') {
      const employeeDocRef = doc(db, 'customer', empid)
      const payDetialsRef = collection(employeeDocRef, 'paydetails')
      await addDoc(payDetialsRef, customerSpendingData)
      }else{
        console.log(spendDatas.spendingtype,spendDatas.name)
        await createSpending(generalSpendingData)
        await spendingUpdateMt()
      }
      setIsSpendingModalOpen((pre) => ({ ...pre, model: false }))
      spendingForm.resetFields()
      message.open({ type: 'success', content: 'Spending added successfully' })
      setSpendSpin(false)
      setPersonOnchangeSt('')
      await deliveryUpdateMt()
    } catch (error) {
      console.log(error)
      setSpendSpin(false)
    }
  }

  const [firstValue, setFirstValue] = useState(null)

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
        <InputNumber size="small" type="number" className="w-[4rem]" min={1} 
          onFocus={(e)=>{
            if (firstValue === null) {
              setFirstValue(e.target.value);
              setQucikSaleTableEdiable({margin:false,packs:true,pieceprice:false,price:false})
            }
          }}
        />
      ) : dataIndex === 'margin' ? (
        <InputNumber
          type="number"
          onFocus={(e) => {
            if (firstValue === null) {
              setFirstValue(e.target.value) // Store the first value
              setQucikSaleTableEdiable({margin:true,packs:false,pieceprice:false,price:false})
              // setIsQuickSale((pre) => ({
              //   ...pre,
              //   temtableedit: { ...pre.temtableedit, margin: true, price: false }
              // }))
            }
          }}
          size="small"
          className="w-[4rem]"
          min={0}
          max={100}
        />
      ) : dataIndex === 'price' ?  (
        <InputNumber
          onFocus={(e) => {
            if (firstValue === null) {
              setFirstValue(e.target.value) // Store the first value
              setQucikSaleTableEdiable({margin:false,packs:false,pieceprice:false,price:true})
              // setIsQuickSale((pre) => ({
              //   ...pre,
              //   temtableedit: { ...pre.temtableedit, margin: false, price: true }
              // }))
            }
          }}
          size="small"
          className="w-[4rem]"
          min={0}
        />
      ): dataIndex === 'productprice' ? (
        <InputNumber
        onFocus={(e) => {
          if (firstValue === null) {
            setFirstValue(e.target.value) // Store the first value
            setQucikSaleTableEdiable({margin:false,packs:false,pieceprice:true,price:false})
            // setIsQuickSale((pre) => ({
            //   ...pre,
            //   temtableedit: { ...pre.temtableedit, margin: false, price: true }
            // }))
          }
        }}
        size="small"
        className="w-[4rem]"
        min={0}
      />
      ) :  (
        <InputNumber
        // onFocus={(e) => {
        //   if (firstValue === null) {
        //     setFirstValue(e.target.value) // Store the first value
        //     setQucikSaleTableEdiable({margin:false,packs:true,pieceprice:false,price:false})
        //     // setIsQuickSale((pre) => ({
        //     //   ...pre,
        //     //   temtableedit: { ...pre.temtableedit, margin: false, price: true }
        //     // }))
        //   }
        // }}
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

  const isEditionTemp = (re) => {
    return isQuickSale.editingKeys.includes(re.key)
  }

  const tempMergedColumns = temTableCl.map((col) => {
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

  const temTbEdit = (re) => {
    form.setFieldsValue({ ...re })
    setIsQuickSale((pre) => ({ ...pre, editingKeys: [re.key] }))
  }

  const cancelTemTable = () => {
    setIsQuickSale((pre) => ({ ...pre, editingKeys: [] }))
  }

  const tempSingleMargin = async (data) => {
    const row = await form.validateFields();
    const tempdata = isQuickSale.temdata;
    let updatedTempproduct;
    try {
      
      if(row.margin === data.margin || row.numberofpacks === data.numberofpacks || row.price === data.price || row.productprice === data.productprice)
      {
        message.open({content:'No changes made', type:'info'});
        setIsQuickSale((pre) => ({ ...pre,  editingKeys: []}));
        setQucikSaleTableEdiable({ pieceprice:true, packs:true,  margin:true, price:true });
        setFirstValue(null);
      }
      else if( qucikSaleTableEdiable.margin)
      {
          updatedTempproduct = tempdata.map((item) => {
          if (item.key === data.key) {
            let mrpData = data.productprice * data.numberofpacks
            let price = mrpData - mrpData * (row.margin / 100)
            let calculatedMargin = row.margin
            if (row.price !== undefined) {
              price = row.price
              calculatedMargin = ((mrpData - price) / mrpData) * 100
            }
            return {
              ...item,
              productprice: data.productprice,
              numberofpacks: data.numberofpacks,
              margin: row.margin,
              mrp: mrpData,
              price: price
            }
          }
          return item
        });
        const totalAmounts = await updatedTempproduct.map(data => data.price).reduce((a,b)=> a + b ,0)
        const mrpAmount = updatedTempproduct.map(data => data.mrp).reduce((a, b) => a + b, 0)
        setIsQuickSale(pre=>({...pre,temdata:updatedTempproduct,editingKeys: [],billamount: totalAmounts, total: mrpAmount,marginstate: true,}));
        setQucikSaleTableEdiable({ pieceprice:true, packs:true,  margin:true, price:true });
        setFirstValue(null);
        message.open({content:'Updated successfully', type:'success'});
      }
      else if( qucikSaleTableEdiable.packs)
      {
        updatedTempproduct = tempdata.map((item) => {
          if (item.key === data.key) {
            let mrpData = data.productprice * row.numberofpacks
            let price = mrpData - mrpData * (data.margin / 100)
            return {
              ...item,
              productprice: data.productprice,
              numberofpacks: row.numberofpacks,
              margin: data.margin,
              mrp: mrpData,
              price: price,
            }
          }
          return item
        });
        const totalAmounts = await updatedTempproduct.map(data => data.price).reduce((a,b)=> a + b ,0)
        const mrpAmount = updatedTempproduct.map(data => data.mrp).reduce((a, b) => a + b, 0);
        setIsQuickSale(pre=>({...pre,temdata:updatedTempproduct,editingKeys: [],billamount: totalAmounts, total: mrpAmount,marginstate: true,}));
        setQucikSaleTableEdiable({ pieceprice:true, packs:true,  margin:true, price:true });
        setFirstValue(null);
        message.open({content:'Updated successfully', type:'success'});
      }
      else if (qucikSaleTableEdiable.price)
      {
        updatedTempproduct = tempdata.map((item) => {
          if (item.key === data.key) {
            let mrpData = data.productprice * data.numberofpacks
            let price = row.price
            return {
              ...item,
              productprice: data.productprice,
              numberofpacks: data.numberofpacks,
              margin: ((mrpData - row.price) / mrpData) * 100,
              mrp: mrpData,
              price: price,
            }
          }
          return item
        });
        const totalAmounts = await updatedTempproduct.map(data => data.price).reduce((a,b)=> a + b ,0)
        const mrpAmount = updatedTempproduct.map(data => data.mrp).reduce((a, b) => a + b, 0);
        setIsQuickSale(pre=>({...pre,temdata:updatedTempproduct,editingKeys: [],billamount: totalAmounts, total: mrpAmount,marginstate: true,}));
        setQucikSaleTableEdiable({ pieceprice:true, packs:true,  margin:true, price:true });
        setFirstValue(null);
        message.open({content:'Updated successfully', type:'success'});
       
      }
      else if (qucikSaleTableEdiable.pieceprice)
      {
        updatedTempproduct = tempdata.map((item) => {
          if (item.key === data.key) {
            let mrpNormal = data.productprice * data.numberofpacks
            let mrpData = row.productprice * data.numberofpacks
            
            let marginvalue = ((data.productprice -  row.productprice) / data.productprice) * 100
            let price = mrpData - mrpData * (0 / 100)
            // console.log(mrpData - mrpData  * (0 / 100));
            
            return {
              ...item,
              // productprice: data.productprice,
              productprice: data.productprice,
              numberofpacks: data.numberofpacks,
              margin: marginvalue,
              mrp: mrpNormal,
              price: price,
              quickproductprice:row.productprice
            }
          }
          return item
        });
        
        // updatedTempproduct = await tempdata.map((item) => {
        //   if (item.key === data.key) {
        //     let mrpData = row.productprice * data.numberofpacks
        //     let price = mrpData - mrpData * (data.margin / 100)
        //     return {
        //       ...item,
        //       // productprice: data.productprice,
        //       productprice: row.productprice,
        //       numberofpacks: data.numberofpacks,
        //       margin: data.margin,
        //       mrp: mrpData,
        //       price: price,
        //       quickproductprice:row.productprice
        //     }
        //   }
        //   return item
        // });

        const totalAmounts = await updatedTempproduct.map(data => data.price).reduce((a,b)=> a + b ,0)
        const mrpAmount = updatedTempproduct.map(data => data.mrp).reduce((a, b) => a + b, 0);
        setIsQuickSale(pre=>({...pre,temdata:updatedTempproduct,editingKeys: [],billamount: totalAmounts, total: mrpAmount,marginstate: true,}));
        setQucikSaleTableEdiable({ pieceprice:true, packs:true,  margin:true, price:true });
        setFirstValue(null);
        message.open({content:'Updated successfully', type:'success'});
      }

     

      // const row = await form.validateFields()
      // const oldtemDatas = isQuickSale.temdata
      // const checkDatas = oldtemDatas.some( (item) =>  item.key === data.key && item.margin === row.margin &&  item.productprice === row.productprice && item.numberofpacks === row.numberofpacks && item.price === row.price);
      
      // if (checkDatas) {
      //   message.open({ type: 'info', content: 'No Changes made' })
      //   setIsQuickSale((pre) => ({ ...pre,  editingKeys: [], temtableedit: { margin: true, price: true } }))
      //   setFirstValue(null);
      // }
      // else{ 
      //   const updatedTempproduct = oldtemDatas.map((item) => {
      //     if (item.key === data.key) {
      //       let mrpData = row.productprice * row.numberofpacks
      //       let price = mrpData - mrpData * (row.margin / 100)
      //       let calculatedMargin = row.margin
      //       if (row.price !== undefined) {
      //         price = row.price
      //         calculatedMargin = ((mrpData - price) / mrpData) * 100
      //       }
      //       return {
      //         ...item,
      //         productprice: row.productprice,
      //         numberofpacks: row.numberofpacks,
      //         margin: row.margin,
      //         mrp: mrpData,
      //         price: price
      //       }
      //     }
      //     return item
      //   });

      //   const totalAmounts = updatedTempproduct.reduce((acc, item) => {
      //     return acc + item.price
      //   }, 0)
      //   const mrpAmount = updatedTempproduct.reduce((acc, item) => {
      //     return acc + item.mrp
      //   }, 0)
      //   setIsQuickSale((pre) => ({
      //     ...pre,
      //     billamount: totalAmounts,
      //     total: mrpAmount,
      //     editingKeys: [],
      //     temdata: updatedTempproduct,
      //     marginstate: true,
      //     temtableedit: { margin: true, price: true }
      //   }))
      //   setFirstValue(null)
      //   message.open({ type: 'success', content: 'Updated successfully' })
      //   setFirstValue(null)
      //   setQucikSaleTableEdiable({ pieceprice:true, packs:true, margin:true, price:true})
      // }
    } catch (e) {
      console.log(e)
    }
  }

  const [spenditSpin, setSpendSpin] = useState(false)

  const [isCloseWarning, setIsCloseWarning] = useState(false)

  const warningModalOk = () => {
    setIsCloseWarning(false)
    setIsQuickSale((pre) => ({
      ...pre,
      model: false,
      temdata: [],
      count: 0,
      total: 0,
      date: dayjs().format('DD/MM/YYYY'),
      margin: 0,
      billamount: 0,
      type: 'quick',
      paymentmode: 'Cash',
      paymentstatus: 'Paid',
      editingKeys: []
    }))
    quickSaleForm.resetFields()

    setIsSpendingModalOpen((pre) => ({ ...pre, model: false }))
    spendingForm.resetFields()
    setPersonOnchangeSt('')
  }
  const productRef = useRef(null)
  useEffect(() => {
    if (isQuickSale.model) {
      setTimeout(() => {
        if (productRef.current) {
          productRef.current.focus()
        }
      }, 0) // Slight delay to ensure modal is fully rendered
    }
  }, [isQuickSale.model])

  const [personOnchangeSt, setPersonOnchangeSt] = useState('')
  const personOnchange = debounce((e) => {
    setPersonOnchangeSt(e)
  }, 200)

  // console.log(isQuickSale.marginstate , !isSpinners , isQuickSale.temdata.length > 0);
  
  return (
    <nav className="border-r-2 h-screen col-span-2 relative">
      <ul>
        <li className="flex flex-col justify-center items-center gap-y-1 my-4">
          <img className="w-full" src={IceCreamLogo} />
        </li>
        {navPages.pages.map((page, i) => (
          <li
            key={i}
            className={`${page === navPages.currentpage ? 'text-white bg-[#f26723] rounded-r-full' : ''} cursor-pointer px-2 py-2 flex items-center gap-x-2`}
            onClick={() => setNavPages((pre) => ({ ...pre, currentpage: page, pagecount: i }))}
          >
            <span>{navPages.icons[i]}</span>
            <span>{page}</span>
          </li>
        ))}
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

      <Button
        className="flex justify-center items-center gap-x-2 bg-[#f26723] text-white p-1 w-[95%] rounded-md absolute bottom-16 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-[#f26723]"
        onClick={() => {
          setProductCount(0)
          setIsQuickSale((pre) => ({
            ...pre,
            model: true,
            dataloading: !isQuickSale.dataloading,
            temdata: [],
            count: 0,
            total: 0,
            date: dayjs().format('DD/MM/YYYY'),
            margin: 0,
            billamount: 0,
            marginstate: false,
            paymentmode: 'Cash',
            paymentstatus: 'Paid'
          }))
          quickSaleForm.resetFields()
          quickSaleForm2.resetFields()
          quickSaleForm3.resetFields()
        }}
      >
        <TbIceCream size={25} />
        <span>Quick Sale</span>
      </Button>
      <Button
        className="flex justify-center items-center gap-x-2 bg-[#f26723] text-white p-1 w-[95%] rounded-md absolute bottom-6 left-1/2 -translate-x-1/2 cursor-pointer hover:bg-[#f26723]"
        onClick={() => {
          setIsSpendingModalOpen((pre) => ({ ...pre, model: true }))
          spendingForm.resetFields()
        }}
      >
        <LiaHandHoldingUsdSolid size={25} />
        <span>Spending</span>
      </Button>
      <span className="flex justify-center items-center gap-x-2 text-gray-500 absolute bottom-1 w-[100%] text-[10px] font-normal">
        Version : 1.6
      </span>
      {/* quick sale */}
      <Modal
        centered={true}
        maskClosable={isQuickSale.temdata.length > 0 ? false : true}
        footer={
          <div className="flex justify-between items-center mt-5"> 
            <Form
              form={quickSaleForm3}
              layout="vertical"
              initialValues={{ paymentstatus: 'Paid', paymentmode: 'Cash' }}
              className="flex gap-x-5 justify-center items-center"
            >
              <Form.Item name="paymentstatus" className="mb-0">
                <Radio.Group
                  disabled={!isSpinners && isQuickSale.temdata.length > 0 ?false : true}
                  buttonStyle="solid"
                  onChange={(e) => {
                    setIsQuickSale((pre) => ({ ...pre, paymentstatus: e.target.value,}))
                    if (e.target.value === 'Paid') {
                      quickSaleForm3.resetFields()
                    }
                    if (e.target.value === 'Unpaid') {
                      quickSaleForm3.resetFields(['partialamount'])
                    }
                    // quickSaleForm3.resetFields(['partialamount'])
                    //  isQuickSale.type === 'booking' ? '' : quickSaleForm3.resetFields(['customername'])
                  }}
                >
                  <Radio.Button value="Paid">PAID</Radio.Button>
                  <Radio.Button value="Unpaid">UNPAID</Radio.Button>
                  <Radio.Button value="Partial">PARTIAL</Radio.Button>
                </Radio.Group>
              </Form.Item>

              {(isQuickSale.paymentstatus === 'Paid' || isQuickSale.paymentstatus === 'Partial') && (
              <Form.Item
                className="mb-0 absolute top-[2rem] left-80"
                name="paymentmode"
                rules={[{ required: true, message: 'Please select a payment method' }]}
              >
                <Radio.Group
                  onChange={(e) => {
                    setIsQuickSale((pre) => ({ ...pre, paymentmode:  isQuickSale.paymentstatus === 'Unpaid' ? '' :   e.target.value }))
                  }}
                  disabled={isQuickSale.marginstate ? false : true}
                >
                  <Radio value="Cash">Cash</Radio>
                  <Radio value="Card">Card</Radio>
                  <Radio value="UPI">UPI</Radio>
                </Radio.Group>
              </Form.Item> 
              )}

              <Form.Item
                rules={[
                  {
                    required: isQuickSale.paymentstatus === 'Partial' ? true : false,
                    message: false
                  }
                ]}
                className="mb-0"
                name="partialamount"
              >
                <InputNumber
                  type="number"
                  placeholder="Amount"
                  min={0}
                  disabled={isQuickSale.paymentstatus === 'Partial' ? false : true}
                />
              </Form.Item>
              <Form.Item
                className="mb-0"
                name="customername"
                rules={[
                  {
                    required:
                      isQuickSale.type === 'booking' ||
                      (isQuickSale.type === 'quick' && isQuickSale.paymentstatus !== 'Paid')
                        ? true
                        : false,
                    message: false
                  }
                ]}
              >
                <Input
                  placeholder="Customer name"
                  disabled={
                    isQuickSale.paymentstatus === 'Partial' ||
                    isQuickSale.type === 'booking' ||
                    (isQuickSale.paymentstatus === 'Unpaid' && isQuickSale.type === 'quick')
                      ? false
                      : true
                  }
                />
              </Form.Item>
              <Form.Item
                className="mb-0"
                name="mobilenumber"
                rules={[
                  {
                    required:
                      isQuickSale.type === 'booking' ||
                      (isQuickSale.type === 'quick' && isQuickSale !== 'Paid')
                        ? true
                        : false,
                    message: false
                  }
                ]}
              >
                <InputNumber
                  type="number"
                  className="w-[10rem]"
                  placeholder="Mobile Number"
                  disabled={
                    isQuickSale.type === 'booking' ||
                    (isQuickSale.type === 'quick' && isQuickSale.paymentstatus !== 'Paid')
                      ? false
                      : true
                  }
                />
              </Form.Item>
              
              <Form.Item
                className="mb-0"
                name="location"
                rules={[
                  {
                    required:
                      isQuickSale.type === 'booking' ||
                      (isQuickSale.type === 'quick' && isQuickSale !== 'Paid')
                        ? true
                        : false,
                    message: false
                  }
                ]}
              >
                <Input
                  className="w-[10rem]"
                  placeholder="Address"
                  disabled={
                    isQuickSale.type === 'booking' ||
                    (isQuickSale.type === 'quick' && isQuickSale.paymentstatus !== 'Paid')
                      ? false
                      : true
                  }
                />
              </Form.Item>

              <Form.Item
                className="mb-0 absolute top-[2rem] left-40"
                name="time"
                rules={[
                  { required: isQuickSale.type === 'booking' ? true : false, message: false }
                ]}
              >
                <TimePicker
                  use12Hours
                  format="h:mm a"
                  className="w-[90%]"
                  disabled={isQuickSale.type === 'booking' ? false : true}
                />
              </Form.Item>
            </Form>

            <Button
              onClick={quicksaleMt}
              disabled={!isSpinners && isQuickSale.temdata.length > 0 ? false : true}
              type="primary"
            >
              Sale
            </Button>
          </div>
        }
        width={1200}
        title={
          <div className="flex  justify-center py-3"> 
            <h1 style={{ fontWeight: 'bold' }}>
              {isQuickSale.type === 'booking' ? 'BOOKING' : 'QUICK SALE'}
            </h1>
          </div>
        }
        open={isQuickSale.model}
        onOk={() => quickSaleForm.submit()}
        onCancel={() => {
          if (isQuickSale.temdata.length > 0) {
            setIsCloseWarning(true)
          } else {
            setIsQuickSale((pre) => ({
              ...pre,
              model: false,
              temdata: [],
              count: 0,
              total: 0,
              date: dayjs().format('DD/MM/YYYY'),
              margin: 0,
              billamount: 0,
              type: 'quick',
              paymentmode: 'Cash',
              paymentstatus: 'Paid',
              editingKeys: []
            }))
            quickSaleForm.resetFields()
          }
        }}
      >
        <Spin spinning={isSpinners}>
          <div className="relative">
            <div className="grid grid-cols-4 gap-x-2">
              <div>
              <Form
                className="col-span-1 relative"
                form={quickSaleForm}
                layout="vertical"
                onFinish={QuickSaleTemAdd}
                initialValues={{ date: dayjs(), type: 'quick' }}
              >
                <Form.Item
                  className="mb-3 absolute top-[-3.45rem]"
                  name="date"
                  label=""
                  rules={[{ required: true, message: false }]}
                >
                  <DatePicker
                    className="w-[8.5rem]"
                    onChange={qickSaledateChange}
                    format={'DD/MM/YYYY'}
                  />
                </Form.Item>
                <Form.Item name="type" className="mb-1 mt-3">
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                    onChange={(e) => {
                      quickSaleForm3.resetFields()
                      setIsQuickSale((pre) => ({
                        ...pre,
                        type: e.target.value,
                        paymentstatus: 'Paid'
                      }))
                    }}
                  >
                    <Radio.Button value="quick" style={{ width: '50%' }}>
                      QUICK
                    </Radio.Button>
                    <Radio.Button value="booking" style={{ width: '50%' }}>
                      BOOKING
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>
                
                
                <Form.Item
                  className="mb-1 mt-4"
                  name="productname"
                  label="Product Name"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    ref={productRef}
                    onChange={productOnchange}
                    showSearch
                    placeholder="Select the Product"
                    options={isQuickSale.proption}
                  />
                </Form.Item>

                {/* <Form.Item
                  className="mb-1"
                  name="flavour"
                  label="Flavour"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    disabled={isQuickSale.flavourinputstatus}
                    onChange={flavourOnchange}
                    showSearch
                    placeholder="Select the Flavour"
                    options={isQuickSale.flaveroption}
                  />
                </Form.Item>

                <Form.Item
                  className="mb-1"
                  name="quantity"
                  label="Quantity"
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    disabled={isQuickSale.quantityinputstatus}
                    showSearch
                    placeholder="Select the Quantity"
                    options={isQuickSale.quntityoption}
                  />
                </Form.Item> */}
                <span className='absolute left-1/2 top-1/2 -translate-x-2 translate-y-[6px]'><Tag className='w-full flex justify-between items-center' size='small' color={productCount <= 0 ? 'red' : 'green'}  ><PiGarageBold size={16} /> {productCount <= 0 ? 0 : productCount} </Tag></span>
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

              <Form
              disabled={!isSpinners && isQuickSale.temdata.length > 0 ? false : true}
              onFinish={marginMt}
              className="flex gap-x-3 mt-5"
              form={quickSaleForm2}
            >
              <Form.Item
                className="mb-0"
                name="marginvalue"
                rules={[{ required: true, message: false }]}
              >
                <InputNumber
                  type="number"
                  min={0}
                  max={100}
                  className="w-52"
                  prefix={<span>Margin(%)</span>}
                />
              </Form.Item>
              <Form.Item className="mb-0">
                <Button type="primary" htmlType="submit">
                  Enter
                </Button>
              </Form.Item>
            </Form>
            </div>

              <Form form={form} component={false}>
                <Table
                  virtual
                  columns={tempMergedColumns}
                  components={{ body: { cell: EditableCellTem } }}
                  pagination={{ pageSize: 4 }}
                  className="col-span-3"
                  dataSource={isQuickSale.temdata}
                  scroll={{ x: false, y: false }}
                />
              </Form>
            </div>

            <span
              className={`absolute top-[-2.7rem] right-10 ${isQuickSale.marginstate === false ? 'hidden' : 'block'}`}
            >
              <Tag color="blue">
                MRP Amount: <span className="text-sm">{formatToRupee(isQuickSale.total)}</span>
              </Tag>
              {/* <Tag color='orange'>Margin: <span className='text-sm'>{isQuickSale.margin}</span>%</Tag> */}
              <Tag color="green">
                Net Amount: <span className="text-sm">{formatToRupee(isQuickSale.billamount)}</span>
              </Tag>
            </span>
          </div>
        </Spin>
      </Modal>

      {/* spendingModal */}
      <Modal
        maskClosable={
          personOnchangeSt === '' || personOnchangeSt === undefined || personOnchangeSt === null
            ? true
            : false
        }
        centered={true}
        title={
          <div className="flex  justify-center py-3">
            {' '}
            <h1>SPENDING</h1>{' '}
          </div>
        }
        open={isSpendingModalOpen.model}
        onOk={() => spendingForm.submit()}
        onCancel={() => {
          if (
            personOnchangeSt === '' ||
            personOnchangeSt === undefined ||
            personOnchangeSt === null
          ) {
            setIsSpendingModalOpen((pre) => ({ ...pre, model: false }))
            spendingForm.resetFields()
            setPersonOnchangeSt('')
          } else {
            setIsCloseWarning(true)
          }
        }}
        okButtonProps={{ disabled: spenditSpin }}
      >
        <Spin spinning={spenditSpin} className="relative">
          <Form
            form={spendingForm}
            layout="vertical"
            onFinish={handleSpendingFinish}
            initialValues={{ date: dayjs(), paymentmode: 'Cash', spendingtype: 'General' }}
          >
            <Form.Item
              className="absolute top-[-3rem]"
              name="date"
              label=""
              rules={[{ required: true, message: false }]}
            >
              <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
            </Form.Item>

            <Form.Item name="spendingtype" className="mb-1 mt-3">
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                    onChange={(e) => {
                      const value = e.target.value;
                      spendingForm.setFieldsValue({ spendingtype: value });
                      setIsSpendingModalOpen((pre) => ({ ...pre, paytype: value }))
                    }}
                  >
                    <Radio.Button value="General" style={{ width: '50%' }}>
                      GENERAL
                    </Radio.Button>
                    <Radio.Button value="Customer" style={{ width: '50%' }}>
                      CUSTOMER
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

            {/* <Form.Item name="type" className="mb-1 mt-3">
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                    disabled={spendingForm.getFieldValue('spendingtype') === 'General'}
                  >
                    <Radio.Button value="Spend" style={{ width: '50%' }}>
                      SPEND
                    </Radio.Button>
                    <Radio.Button value="Advance" style={{ width: '50%' }}>
                      ADVANCE
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item> */}

                {spendingForm.getFieldValue('spendingtype') === 'General' && (
                <Form.Item
              name="name"
              label="Person"
              className="mb-1"
              rules={[{ required: true, message: false }]}
            >
              <Input
                className="w-full"
                placeholder="Enter the Person name"
              />
            </Form.Item>
                )}

            {spendingForm.getFieldValue('spendingtype') === 'Customer' && (
            <Form.Item
              className="mb-1"
              name="empid"
              label="Customer"
              rules={[{ required: true, message: false }]}
            >
              <Select
                onChange={(e) => personOnchange(e)}
                showSearch
                placeholder="Select the Customer"
                options={isSpendingModalOpen.employeeoption}
                // filterSort={(optionA, optionB) =>
                //   (optionA?.label ?? '')
                //     .toLowerCase()
                //     .localeCompare((optionB?.label ?? '').toLowerCase())
                // }
                filterOption={(input, option) =>
    option?.label.toLowerCase().includes(input.toLowerCase())
  }
              />
            </Form.Item>
            )}

            <Form.Item
              name="amount"
              label="Amount"
              className="mb-1"
              rules={[{ required: true, message: false }]}
            >
              <InputNumber
                type="number"
                min={0}
                className="w-full"
                placeholder="Enter the Amount"
              />
            </Form.Item>

            <Form.Item name="description" label="Description" className="mb-1">
              <TextArea rows={4} placeholder="Write the Description" />
            </Form.Item>

            <Form.Item
                className="mb-0"
                name="paymentmode"
                label="Payment Mode"
                rules={[{ required: true, message: false }]}
              >
                <Radio.Group
                   size='small'>
                  <Radio value="Cash">Cash</Radio>
                  <Radio value="Card">Card</Radio>
                  <Radio value="UPI">UPI</Radio>
                </Radio.Group>
              </Form.Item>

          </Form>
        </Spin>
      </Modal>
    </nav>
  )
}
