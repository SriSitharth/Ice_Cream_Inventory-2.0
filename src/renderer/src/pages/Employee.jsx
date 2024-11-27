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
  Spin,
  Tag,
  Tooltip
} from 'antd'
import { PiExport } from 'react-icons/pi'
import { IoMdAdd } from 'react-icons/io'
import { SolutionOutlined } from '@ant-design/icons'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { AiOutlineDelete } from 'react-icons/ai'
import { MdOutlinePayments } from 'react-icons/md'
import { TimestampJs } from '../js-files/time-stamp'
import jsonToExcel from '../js-files/json-to-excel'
import {
  createEmployee,
  fetchPayDetailsForEmployee,
  updateEmployee,
  updatePayDetailsForEmployee
} from '../firebase/data-tables/employee'
const { Search, TextArea } = Input
import dayjs from 'dayjs'
import { addDoc, collection, doc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { formatToRupee } from '../js-files/formate-to-rupee'
import { debounce } from 'lodash'
import { PiWarningCircleFill } from 'react-icons/pi'
import { latestFirstSort } from '../js-files/sort-time-date-sec'
import { truncateString } from '../js-files/letter-length-sorting'

export default function Employee({ datas, employeeUpdateMt }) {
  // states
  const [form] = Form.useForm()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingKeys, setEditingKeys] = useState([])
  const [data, setData] = useState([])
  const [employeeTbLoading, setEmployeeTbLoading] = useState(true)
  const [totalPaymentAmount, setTotalPaymentAmount] = useState(0)
  const [totalReturnAmount, setTotalReturnAmount] = useState(0)

  // side effect
  useEffect(() => {
    setEmployeeTbLoading(true)
    const filteredData = datas.employees
      .filter((data) => data.isdeleted === false)
      .map((item, index) => ({ ...item, sno: index + 1, key: item.id || index }))
    setData(filteredData)
    setEmployeeTbLoading(false)
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

  const [isNewEployeeLoading, setIsNewEmployeeLoading] = useState(false)
  // create new project
  const createNewEmployee = async (values) => {
    setIsNewEmployeeLoading(true)
    try {
      await createEmployee({
        ...values,
        createddate: TimestampJs(),
        updateddate: '',
        isdeleted: false
      })
      form.resetFields()
      employeeUpdateMt()
      message.open({ type: 'success', content: 'Created Successfully' })
    } catch (e) {
      console.log(e);
      message.open({ type: 'error', content: `${e} Created Unsuccessfully` })
    } finally {
      setIsModalOpen(false)
      setIsNewEmployeeLoading(false)
      setEmployeeOnchange({
        employeename: '',
        payamount: ''
      })
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
          String(record.position).toLowerCase().includes(value.toLowerCase()) ||
          String(record.mobilenumber).toLowerCase().includes(value.toLowerCase()) ||
          String(record.location).toLowerCase().includes(value.toLowerCase()) ||
          String(record.employeename).toLowerCase().includes(value.toLowerCase()) || 
          String(record.gender).toLowerCase().includes(value.toLowerCase()) 
        )
      }
    },
    {
      title: 'Employee',
      dataIndex: 'employeename',
      key: 'employeename',
      editable: true,
      sorter: (a, b) => a.employeename.localeCompare(b.employeename),
      showSorterTooltip: { target: 'sorter-icon' },
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Role',
      dataIndex: 'position',
      key: 'position',
      editable: true,
      sorter: (a, b) => a.position.localeCompare(b.position),
      showSorterTooltip: { target: 'sorter-icon' },
      width: 143
    },
    {
      title: 'Address',
      dataIndex: 'location',
      key: 'location',
      editable: true,
      sorter: (a, b) => a.location.localeCompare(b.location),
      showSorterTooltip: { target: 'sorter-icon' },
      render: (text,record)=>{
        return text.length > 18 ? <Tooltip title={text}>{truncateString(text,18)}</Tooltip> : text
      }
    },
    {
      title: 'Mobile',
      dataIndex: 'mobilenumber',
      key: 'mobilenumber',
      editable: true,
      width: 140
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      editable: true,
      width: 105
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
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              onClick={() => {
                setEmployeePay((pre) => ({ ...pre, modal: true, name: record }))
              }}
            >
              Pay
              <MdOutlinePayments />
            </Button>
            <Button
              className="py-0 text-[0.7rem] h-[1.7rem]"
              disabled={editingKeys.length !== 0 || selectedRowKeys.length !== 0}
              onClick={async () => {
                setEmployeePay((pre) => ({ ...pre, name: record }))
                setEmpListTb(true)
                let { paydetails, status } = await fetchPayDetailsForEmployee(record.id)
                if (status) {
                  let checkPayData = paydetails.filter((item) => item.isdeleted === false)
                  let lastestSrot =await latestFirstSort(checkPayData.filter(paydata => paydata.isdeleted === false));
                  const totalPayment = checkPayData.reduce((total, item) => {
                    if (item.type === 'Payment') {
                      return total + (Number(item.amount) || 0);
                    }
                    return total;
                  }, 0);
                  setTotalPaymentAmount(totalPayment);
                  
                  const totalReturn = checkPayData.reduce((total, item) => {
                    if (item.type === 'Return') {
                      return total + (Number(item.amount) || 0);
                    }
                    return total;
                  }, 0);
                  setTotalReturnAmount(totalReturn);

                  setEmployeePayDetails((pre) => ({
                    ...pre,
                    modal: true,
                    data: lastestSrot,
                    parentid: record.id
                  }))
                }
                setEmpListTb(false)
              }}
            >
              <SolutionOutlined />
            </Button>
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
            {dataIndex === 'gender' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="gender"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Gender"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Male', label: 'Male' },
                      { value: 'Female', label: 'Female' }
                    ]}
                  />
                </Form.Item>
              </span>
            ) : dataIndex === 'position' ? (
              <span className="flex gap-x-1">
                <Form.Item
                  name="position"
                  style={{ margin: 0 }}
                  rules={[{ required: true, message: false }]}
                >
                  <Select
                    placeholder="Select Position"
                    optionFilterProp="label"
                    filterSort={(optionA, optionB) =>
                      (optionA?.label ?? '')
                        .toLowerCase()
                        .localeCompare((optionB?.label ?? '').toLowerCase())
                    }
                    options={[
                      { value: 'Office Admin', label: 'Office Admin' },
                      { value: 'Worker', label: 'Worker' }
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
        inputType: col.dataIndex === 'mobilenumber' ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record)
      })
    }});

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
        row.employeename === key.employeename &&
        row.position === key.position &&
        row.location === key.location &&
        row.mobilenumber === key.mobilenumber &&
        row.gender === key.gender
      ) {
        message.open({ type: 'info', content: 'No changes made' })
        setEditingKeys([])
      } else {
        await updateEmployee(key.id, { ...row, updateddate: TimestampJs() })
        employeeUpdateMt()
        message.open({ type: 'success', content: 'Updated Successfully' })
        setEditingKeys([])
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
    const { id, ...newData } = data;
    // console.log(id);
    let {paydetails,status} = await fetchPayDetailsForEmployee(id);
    if(paydetails.length >0){
      paydetails.map( async paydata =>{
          await updatePayDetailsForEmployee(id,paydata.id,{isdeleted:true});
      });
    };
    await updateEmployee(id, {
      isdeleted: true,
      // deletedby: 'admin',
      deleteddate: TimestampJs()
    });
    employeeUpdateMt();
    message.open({ type: 'success', content: 'Deleted Successfully' });
  };

  // export
  const exportExcel = async () => {
    const exportDatas = data.filter((item) => selectedRowKeys.includes(item.key))
    const excelDatas = exportDatas.map((pr, i) => ({
      No: i + 1,
      Employee: pr.employeename,
      Gender: pr.gender,
      Mobile: pr.mobilenumber,
      Location: pr.location,
      Position: pr.position
    }))
    jsonToExcel(excelDatas, `Employee-List-${TimestampJs()}`)
    setSelectedRowKeys([])
    setEditingKeys('')
  };

  // employee pay
  const [employeePayForm] = Form.useForm()
  const [employeePay, setEmployeePay] = useState({
    modal: false,
    name: {},
    data: dayjs().format('DD/MMM/YYYY'),
  });

  const [isEmpLoading, setIsEmpLoading] = useState(false)
  const empPayMt = async (value) => {
    setIsEmpLoading(true)
    let { date, description, ...Datas } = value
    let formateDate = dayjs(date).format('DD/MM/YYYY')
    const empId = employeePay.name.id
    const payData = {
      ...Datas,
      collectiontype:'employee',
      employeeid: empId,
      date: formateDate,
      description: description === undefined ? '' : description,
      createddate: TimestampJs(),
      isdeleted: false,
    }

    try {
      const employeeDocRef = doc(db, 'employee', empId)
      const payDetailsRef = collection(employeeDocRef, 'paydetails')
      await addDoc(payDetailsRef, payData)
      message.open({ type: 'success', content: 'Pay Added Successfully' })
    } catch (e) {
      console.log(e)
    } finally {
      employeePayForm.resetFields()
      setEmployeePay((pre) => ({ ...pre, modal: false }))
      setIsEmpLoading(false)
      setEmployeeOnchange({
        employeename: '',
        payamount: ''
      })
    }
  }

  // employee pay details
  const [employeePayDetails, setEmployeePayDetails] = useState({
    modal: false,
    data: [],
    isedit: [],
    parentid: 0
  })

  const employeePayDetailsColumn = [
    {
      title: 'S.No',
      dataIndex: 'sno',
      key: 'sno',
      width: 50,
      render: (_, record, index) => <span>{index + 1}</span>
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
      editable: true,
      width: 115
    },
    {
      title: 'Payment',
      dataIndex: 'amount',
      key: 'payment',
      render: (_, record) => (
        <span>{record.type === 'Payment' ? formatToRupee(record.amount, true) : ''}</span>
      ),
      width: 160
    },
    {
      title: 'Return',
      dataIndex: 'amount',
      key: 'return',
      render: (_, record) => (
        <span>{record.type === 'Return' ? formatToRupee(record.amount, true) : ''}</span>
      ),
      width: 160
    },
    {
      title: 'Mode',
      dataIndex: 'paymentmode',
      key: 'paymentmode',
      width: 70,
      render: (_, record) => (
        <> 
        <Tag color="cyan">{record.paymentmode ? record.paymentmode : ''}</Tag>
        </>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    }
  ]

  const isEmpDtailTableEditing = (record) => {
    return employeePayDetails.isedit.includes(record.id)
  }

  const mergedEmpPayDetailColumn = employeePayDetailsColumn.map((item) => {
    if (!item.editable) {
      return item
    }
    return {
      ...item,
      onCell: (record) => ({
        record,
        dataIndex: item.dataIndex,
        title: item.title,
        editing: isEmpDtailTableEditing(record)
      })
    }
  });

  const empDetailTbEdit = (record) => {
    const date = dayjs(record.date, 'DD/MM/YYYY')
    empdetailpayform.setFieldsValue({ ...record, date })
    setEmployeePayDetails((pre) => ({ ...pre, isedit: [record.id] }))
  };

  const EmpPayDetailTableEditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    const inputNode = dataIndex === 'amount' ? <InputNumber /> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
          dataIndex === 'date' ? (
            <Form.Item
              name="date"
              style={{ margin: 0 }}
              valuePropName="value"
              rules={[{ required: true, message: false }]}
            >
              <DatePicker format="DD/MM/YYYY" />
            </Form.Item>
          ) : (
            <Form.Item
              name={dataIndex}
              style={{ margin: 0 }}
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

  const [empdetailpayform] = Form.useForm()
  // edid cell save
  const payDetailSave = async (value) => {
    try {
      const row = await empdetailpayform.validateFields()
      const oldData = [...employeePayDetails.data]
      const index = oldData.findIndex((item) => value.id === item.id)
      const existingData = oldData.filter((item) => item.id === value.id)[0]
      const newDatas = { ...row, date: row.date.format('DD/MM/YYYY'), updateddate: TimestampJs() }
      if (
        existingData.amount === row.amount &&
        existingData.description === row.description &&
        existingData.date === row.date.format('DD/MM/YYYY') &&
        index !== null
      ) {
        message.open({
          type: 'info',
          content: 'No changes made',
          duration: 2
        })
        setEmployeePayDetails((pre) => ({ ...pre, isedit: [] }))
        return
      } else {
        await updatePayDetailsForEmployee(employeePayDetails.parentid, value.id, newDatas)
        setEmployeePayDetails((pre) => ({ ...pre, isedit: [] }))
        employeeUpdateMt()
        let { paydetails, status } = await fetchPayDetailsForEmployee(employeePayDetails.parentid)
        if (status) {
          let checkPayData = paydetails.filter((item) => item.isdeleted === false)
          setEmployeePayDetails((pre) => ({ ...pre, data: checkPayData }))
        }
        message.open({ type: 'success', content: 'Payment Data updated successfully' })
      }
    } catch (e) {
      console.log(e)
    }
  }

  // delete row
  const payDetailDelete = async (value) => {
    await updatePayDetailsForEmployee(employeePayDetails.parentid, value.id, {
      isdeleted: true,
      updateddate: TimestampJs()
    })
    employeeUpdateMt()
    let { paydetails, status } = await fetchPayDetailsForEmployee(employeePayDetails.parentid)
    if (status) {
      let checkPayData = paydetails.filter((item) => item.isdeleted === false)
      setEmployeePayDetails((pre) => ({ ...pre, data: checkPayData }))
    }
    message.open({ type: 'success', content: 'Payment Data deleted successfully' })
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

  const [empListTb, setEmpListTb] = useState(true)

  // warning modal methods
  const [isCloseWarning, setIsCloseWarning] = useState(false)
  const [employeeOnchange, setEmployeeOnchange] = useState({
    employeename: '',
    payamount: ''
  })

  const warningModalOk = () => {
    setEmployeePay((pre) => ({ ...pre, modal: false }))
    employeePayForm.resetFields()

    setIsModalOpen(false)
    form.resetFields()

    setIsCloseWarning(false)
    setEmployeeOnchange({
      employeename: '',
      payamount: ''
    })
  }

  const employeeOnchangeMt = debounce((e, input) => {
    if (input === 'employeename') {
      setEmployeeOnchange({
        employeename: e.target.value,
        payamount: ''
      })
    } else {
      setEmployeeOnchange({
        employeename: '',
        payamount: e
      })
    }
  }, 200)

  return (
    <div>
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
                form.setFieldsValue({ gender: 'Male', position: 'Worker' })
              }}
            >
              New Employee <IoMdAdd />
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
              loading={employeeTbLoading}
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
          employeeOnchange.employeename === '' ||
          employeeOnchange.employeename === undefined ||
          employeeOnchange.employeename === null
            ? true
            : false
        }
        title={<span className="flex justify-center">NEW EMPLOYEE</span>}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => {
          if (
            employeeOnchange.employeename === '' ||
            employeeOnchange.employeename === undefined ||
            employeeOnchange.employeename === null
          ) {
            setIsModalOpen(false)
            form.resetFields()
          } else {
            setIsCloseWarning(true)
          }
        }}
        okButtonProps={{ disabled: isNewEployeeLoading }}
      >
        <Spin spinning={isNewEployeeLoading}>
          <Form
            initialValues={{ gender: 'Male', position: 'Worker' }}
            onFinish={createNewEmployee}
            form={form}
            layout="vertical"
          >
            <Form.Item
              className="mb-2"
              name="employeename"
              label="Name"
              rules={[{ required: true, message: false }]}
            >
              <Input
                onChange={(e) => employeeOnchangeMt(e, 'employeename')}
                placeholder="Enter the Employee Name"
              />
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="gender"
              label="Gender"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group>
                <Radio value={'Male'}>Male</Radio>
                <Radio value={'Female'}>Female</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              className="mb-2"
              name="position"
              label="Role"
              rules={[{ required: true, message: false }]}
            >
              <Radio.Group>
                <Radio value={'Owner'}>Owner</Radio>
                <Radio value={'Office Admin'}>Office Admin</Radio>
                <Radio value={'Worker'}>Worker</Radio>
              </Radio.Group>
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
              <InputNumber  className="w-full" type="number" placeholder="Enter the Mobile Number" />
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
          employeeOnchange.payamount === '' ||
          employeeOnchange.payamount === undefined ||
          employeeOnchange.payamount === null
            ? true
            : false
        }
        open={employeePay.modal}
        onCancel={() => {
          if (
            employeeOnchange.payamount === '' ||
            employeeOnchange.payamount === undefined ||
            employeeOnchange.payamount === null
          ) {
            setEmployeePay((pre) => ({ ...pre, modal: false }))
            employeePayForm.resetFields()
          } else {
            setIsCloseWarning(true)
          }
        }}
        onOk={() => employeePayForm.submit()}
        okButtonProps={{ disabled: isEmpLoading }}
      >
        <Spin spinning={isEmpLoading}>
          <span className="block w-full text-center mb-7 text-xl font-bold">{employeePay.name.employeename}</span>
          <Form
            onFinish={empPayMt}
            form={employeePayForm}
            initialValues={{ date: dayjs(), paymentmode: 'Cash', type: 'Payment' }}
            layout="vertical"
          >
            <Form.Item name="type" className="mb-1 mt-3">
                  <Radio.Group
                    buttonStyle="solid"
                    style={{ width: '100%', textAlign: 'center', fontWeight: '600' }}
                  >
                    <Radio.Button value="Payment" style={{ width: '50%' }}>
                      PAID
                    </Radio.Button>
                    <Radio.Button value="Return" style={{ width: '50%' }}>
                      RETURN
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

            <Form.Item className="mb-1" name="amount" label="Amount" rules={[{ required: true, message: false }]}>
              <InputNumber
                onChange={(e) => employeeOnchangeMt(e)}
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
              className=" absolute top-1"
              name="date"
              label=""
              rules={[{ required: true, message: false }]}
            >
              <DatePicker className="w-[8.5rem]" format={'DD/MM/YYYY'} />
            </Form.Item>

            <Form.Item
                className="mb-0 top-[2rem] left-80"
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

      <Modal
        title={
         <div className='relative'>
           <Tag color='blue' className='absolute left-4'>{employeePay.name.employeename}</Tag>
           <span className="text-center w-full block pb-5">PAY DETAILS</span>
         </div>
        }
        open={employeePayDetails.modal}
        footer={null}
        pagination={{ pageSize: 5 }}
        width={1000}
        height={historyHeight}
        onCancel={() => {
          setEmployeePayDetails((pre) => ({ ...pre, modal: false, data: [], isedit: [] }))
        }}
      >
        <Form form={empdetailpayform} component={false}>
          <Table
            virtual
            loading={empListTb}
            pagination={false}
            columns={mergedEmpPayDetailColumn}
            components={{ body: { cell: EmpPayDetailTableEditableCell } }}
            scroll={{ x: false, y: historyHeight }}
            dataSource={employeePayDetails.data}
            rowKey="id"
          />
          <div className="flex justify-between mt-2 font-semibold">
            <div>Payment: {totalPaymentAmount.toFixed(2)}</div>
            <div>Return: {totalReturnAmount.toFixed(2)}</div>
          </div>
        </Form>
      </Modal>
    </div>
  )
}
