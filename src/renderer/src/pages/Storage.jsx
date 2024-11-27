import React, { useState, useEffect } from 'react'
import {
  Input,
  Table,
  Segmented,
  Modal,
  Form,
  InputNumber,
  Popconfirm,
  Typography,
  message
} from 'antd'
import { LuMilk, LuIceCream } from 'react-icons/lu'
import { TimestampJs } from '../js-files/time-stamp'
import { updateStorage } from '../firebase/data-tables/storage'
import { MdOutlineModeEditOutline } from 'react-icons/md'
import { LuSave } from 'react-icons/lu'
import { TiCancel } from 'react-icons/ti'
import { getProductById } from '../firebase/data-tables/products'
const { Search } = Input

export default function Storage({ datas, storageUpdateMt }) {
  const [form] = Form.useForm()
  const [ediablefForm] = Form.useForm()
  const [data, setData] = useState([])
  const [selectedSegment, setSelectedSegment] = useState('Material List')
  const [isSegmentDisabled, setIsSegmentDisabled] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [editingKeys, setEditingKeys] = useState([])
  const [tableLoading, setTableLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setTableLoading(true);
      
      const rawData = datas.storage.filter((data) => data.category === selectedSegment);
      const checkCategory = rawData.some((data) => data.category === 'Product List');
      
      let sortedData = [];
  
      if (checkCategory) {
        const idCompareData = await Promise.all(
          rawData.map(async (data) => {
            const { product, status } = await getProductById(data.productid);
            if (status) {
              const { id, ...filterpr } = product;
              return { ...data, ...filterpr };
            }
            return data;
          })
        );
        sortedData = idCompareData.sort((a, b) => {
          if (!a.productname) return 1;
          if (!b.productname) return -1;
          return a.productname.localeCompare(b.productname);
        });
      } else {
        sortedData = rawData.sort((a, b) => {
          if (!a.materialname) return 1;
          if (!b.materialname) return -1;
          return a.materialname.localeCompare(b.materialname);
        });
      }

      let filterSortedData = sortedData.length > 0 ? sortedData.filter(data => data.isdeleted === false) : sortedData;
  
      setData(filterSortedData);
      setTableLoading(false);
    };
  
    fetchData(); 
  }, [datas, selectedSegment]);
  
  

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

  const setAlert = async (values) => {
    if (editingRecordId) {
      await updateStorage(editingRecordId, {
        alertcount: values.alertcount,
        updateddate: TimestampJs()
      })
    }
    form.resetFields()
    storageUpdateMt()
    setEditingRecordId(null)
    setIsModalVisible(false)
  }

  const onSegmentChange = (value) => {
    setIsSegmentDisabled(true)
    setEditingKeys([])
    setSelectedSegment(value)
    setSearchText('')

    setTimeout(() => {
      setIsSegmentDisabled(false)
    }, 1000)
  }

  const materialColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.materialname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase())
        )
      },
      editable: false
    },
    {
      title: 'Material',
      dataIndex: 'materialname',
      key: 'materialname',
      sorter: (a, b) =>a.materialname.localeCompare(b.materialname),
      showSorterTooltip: { target: 'sorter-icon' },
      // defaultSortOrder: 'ascend',
      editable: false
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      editable: true,
      render: (text, record) => {
        return (
          <div>
            <span>{text}</span> <span>{record.unit}</span>
          </div>
        );
      }
    },
    {
      title: 'Alert Count',
      dataIndex: 'alertcount',
      key: 'alertcount',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <span className="flex gap-x-1 items-center">
            <Typography.Link onClick={() => storageSave(record)} style={{ marginRight: 8 }}>
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 items-center">
            <Typography.Link disabled={editingKeys.length !== 0} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={19} />
            </Typography.Link>
          </span>
        )
      }
    }
  ]

  const productColumns = [
    {
      title: 'S.No',
      key: 'sno',
      width: 70,
      render: (_, __, index) => index + 1,
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.productname).toLowerCase().includes(value.toLowerCase()) ||
          String(record.flavour).toLowerCase().includes(value.toLowerCase()) ||
          String(record.quantity).toLowerCase().includes(value.toLowerCase()) ||
          String(record.alertcount).toLowerCase().includes(value.toLowerCase()) ||
          String(record.numberofpacks).toLowerCase().includes(value.toLowerCase())
        )
      },
      editable:false
    },
    {
      title: 'Product',
      dataIndex: 'productname',
      key: 'productname',
      sorter:  (a, b) => a.productname.localeCompare(b.productname),
      showSorterTooltip: { target: 'sorter-icon' },
      // defaultSortOrder: 'ascend',
      editable:false
    },
    // {
    //   title: 'Flavor',
    //   dataIndex: 'flavour',
    //   key: 'flavour',
    //   sorter: (a, b) => a.flavour.localeCompare(b.flavour),
    //   showSorterTooltip: { target: 'sorter-icon' },
    //   editable:false
    // },
    // {
    //   title: 'Quantity',
    //   dataIndex: 'quantity',
    //   key: 'quantity',
    //   editable:false,
    //   render: (text, record) => {
    //     return (
    //       <div>
    //         <span>{text}</span> <span>{record.unit}</span>
    //       </div>
    //     );
    //   }
    // },
    {
      title: 'Packs',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, record) => {
        const quotient = Math.floor(record.numberofpacks / record.productperpack)
        const remainder = record.numberofpacks % record.productperpack
        return `${quotient} Pack , ${remainder} Piece`
      }
    },
    {
      title: 'Piece',
      dataIndex: 'numberofpacks',
      key: 'numberofpacks',
      sorter: (a, b) => (Number(a.numberofpacks) || 0) - (Number(b.numberofpacks) || 0),
      showSorterTooltip: { target: 'sorter-icon' },
      editable: true
    },
    {
      title: 'Alert Count',
      dataIndex: 'alertcount',
      key: 'alertcount',
      editable: true
    },
    {
      title: 'Action',
      dataIndex: 'operation',
      fixed: 'right',
      width: 110,
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <span className="flex gap-x-1 items-center">
            <Typography.Link onClick={() => storageSave(record)} style={{ marginRight: 8 }}>
              <LuSave size={17} />
            </Typography.Link>
            <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
              <TiCancel size={20} className="text-red-500 cursor-pointer hover:text-red-400" />
            </Popconfirm>
          </span>
        ) : (
          <span className="flex gap-x-3 items-center">
            <Typography.Link disabled={editingKeys.length !== 0} onClick={() => edit(record)}>
              <MdOutlineModeEditOutline size={19} />
            </Typography.Link>
          </span>
        )
      }
    }
  ]

  const columns = selectedSegment === 'Material List' ? materialColumns : productColumns;

  const edit = (record) => {
    ediablefForm.setFieldsValue({ ...record })
    setEditingKeys([record.id])
  }

  const isEditing = (record) => {
    return editingKeys.includes(record.id)
  }

  const mergedColumns = columns.map((item) => {
    if (!item.editable) {
      return item
    }
    return {
      ...item,
      onCell: (record) => ({
        record,
        inputType: item.dataIndex,
        dataIndex: item.dataIndex,
        title: item.title,
        editing: isEditing(record)
      })
    }
  })

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
    const inputNode =
      dataIndex === 'quantity' || dataIndex === 'alertcount' || dataIndex === 'numberofpacks' ? <InputNumber type='number'/> : <Input />
    return (
      <td {...restProps}>
        {editing ? (
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
        ) : (
          children
        )}
      </td>
    )
  }

  const cancel = () => {
    setEditingKeys([])
  }

  const storageSave = async (record) => {
    console.log(record);
    
    try {
      const row = await ediablefForm.validateFields()
      if (selectedSegment === 'Material List') {
        const exsitingData = await datas.storage.some((item) => item.id === record.id && item.alertcount === row.alertcount && item.quantity === row.quantity)
        if (exsitingData) {
          message.open({ type: 'info', content: 'Data already exists'})
          setEditingKeys([])
        } else {
          setTableLoading(true)
          await updateStorage(record.id, {
            alertcount: row.alertcount, 
            quantity: row.quantity,
            updateddate: TimestampJs()
          })
          storageUpdateMt()
          message.open({ type: 'success', content: 'Updated successfully' })
          setEditingKeys([])
          setTableLoading(false)
        }
      } else {
        const exsitingData = await datas.storage.some((item) => item.id === record.id && item.numberofpacks === row.numberofpacks && item.alertcount === row.alertcount)

        if (exsitingData) {
          message.open({
            type: 'info',
            content: 'Data already exists',
          })
          setEditingKeys([])
        } else {
          setTableLoading(true)
          await updateStorage(record.id, {
            alertcount: row.alertcount,
            numberofpacks: row.numberofpacks,
            updateddate: TimestampJs()
          })
          storageUpdateMt()
          message.open({ type: 'success', content: 'Updated successfully' })
          setEditingKeys([])
          setTableLoading(false)
        }
      }
    } catch (e) {
      console.log(e)
    }
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

  return (
    <div>
      <ul>
        <li className="flex gap-x-3 justify-between items-center">
          <Search
            placeholder="Search"
            className="w-[30%]"
            onSearch={onSearchEnter}
            onChange={onSearchChange}
            enterButton
          />

          <Segmented
          disabled={isSegmentDisabled}
            options={[
              {
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <LuMilk />
                    <span>Material List</span>
                  </div>
                ),
                value: 'Material List'
              },
              {
                label: (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <LuIceCream />
                    <span>Product List</span>
                  </div>
                ),
                value: 'Product List'
              }
            ]}
            onChange={onSegmentChange}
            value={selectedSegment}
          />
        </li>

        <li className="mt-2">
          <Form form={ediablefForm} component={false}>
            <Table
              virtual
              columns={mergedColumns}
              components={{ body: { cell: EditableCell } }}
              dataSource={data}
              loading={tableLoading}
              pagination={false}
              scroll={{ x: 900, y: tableHeight }}
              rowKey="id"
              // locale={{ emptyText: <span>No data available</span> }}
            />
          </Form>
        </li>
      </ul>

      <Modal
        title="Set Alert"
        open={isModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form onFinish={setAlert} form={form} layout="vertical">
          {selectedSegment === 'Material List' && (
            <>
              <Form.Item name="materialname" label="Material">
                <Input disabled />
              </Form.Item>
              <Form.Item name="alertcount" label="Alert Count" rules={[{ required: true }]}>
                <InputNumber className="w-full" type="number" />
              </Form.Item>
            </>
          )}
          {selectedSegment === 'Product List' && (
            <>
              <Form.Item name="productname" label="Product">
                <Input disabled />
              </Form.Item>
              <Form.Item name="flavour" label="Flavor">
                <Input disabled />
              </Form.Item>
              <Form.Item name="quantity" label="Quantity">
                <Input disabled />
              </Form.Item>
              <Form.Item name="alertcount" label="Alert Count" rules={[{ required: true }]}>
                <InputNumber className="w-full" type="number" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  )
}
