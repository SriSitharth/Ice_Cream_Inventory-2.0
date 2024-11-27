import NavBar from './components/NavBar'
import { useEffect, useState } from 'react'
import { GoHome } from 'react-icons/go'
import { TbTruckDelivery } from 'react-icons/tb'
import { LuIceCream } from 'react-icons/lu'
import { PiGarageBold } from 'react-icons/pi'
import { LuBoxes } from 'react-icons/lu'
import { MdOutlinePeopleAlt } from 'react-icons/md'
import { PiUserListBold } from 'react-icons/pi'
import { GrUserWorker } from 'react-icons/gr'
import { LuMilk } from 'react-icons/lu'
import { notification, Button } from 'antd'
import { FaBoxesPacking } from 'react-icons/fa6'
import { TbFileSpreadsheet } from 'react-icons/tb'
import Pages from './components/Pages'
import { getMaterialDetailsById, getSupplier } from './firebase/data-tables/supplier'
import { getproduct, getProductById } from './firebase/data-tables/products'
import { getCustomer } from './firebase/data-tables/customer'
import { getRawmaterial } from './firebase/data-tables/rawmaterial'
import { getDelivery } from './firebase/data-tables/delivery'
import { getEmployee } from './firebase/data-tables/employee'
import { getProduction } from './firebase/data-tables/production'
import { getStorage } from './firebase/data-tables/storage'
import { getSpending } from './firebase/data-tables/spending'
import dayjs from 'dayjs'
import { getBalanceSheet } from './firebase/data-tables/balancesheet'
import { getFreezerbox } from './firebase/data-tables/freezerbox'
import { latestFirstSort } from './js-files/sort-time-date-sec'

const App = () => {
  const [navPages, setNavPages] = useState({
    pages: [
      'Home',
      'Raw Material',
      'Production',
      'Delivery',
      'Storage',
      'Products',
      'Suppliers',
      'Customers',
      'Employees',
      'Balance Sheet'
    ],
    icons: [
      <GoHome size={19} />,
      <LuMilk size={17} />,
      <LuBoxes size={17} />,
      <TbTruckDelivery size={17} />,
      <PiGarageBold size={17} />,
      <LuIceCream size={17} />,
      <MdOutlinePeopleAlt size={17} />,
      <PiUserListBold size={17} />,
      <GrUserWorker size={17} />,
      <TbFileSpreadsheet size={17} />
    ],
    currentpage: 'Home',
    pagecount: 0
  })

  const [datas, setDatas] = useState({
    product: [],
    projectupdatestaus: false,
    suppliers: [],
    supplierupdatestaus: false,
    customers: [],
    customerupdatestaus: false,
    rawmaterials: [],
    rawmaterialupdatestaus: false,
    delivery: [],
    deliveryupdatestaus: false,
    employees: [],
    employeeupdatestaus: false,
    productions: [],
    productionupdatestaus: false,
    usedmaterials: [],
    usedmaterialupdatestaus: false,
    storage: [],
    storageupdatestaus: false,
    balancesheet: [],
    balancesheetstatus: false,
    spending: [],
    spendingupdatestatus: false,
    freezerbox: [],
    freezerboxstatus: false
  })

  const productUpdateMt = () =>
    setDatas((pre) => ({ ...pre, projectupdatestaus: !pre.projectupdatestaus }))
  const supplierUpdateMt = () =>
    setDatas((pre) => ({ ...pre, supplierupdatestaus: !pre.supplierupdatestaus }))
  const customerUpdateMt = () =>
    setDatas((pre) => ({ ...pre, customerupdatestaus: !pre.customerupdatestaus }))
  const rawmaterialUpdateMt = () =>
    setDatas((pre) => ({ ...pre, rawmaterialupdatestaus: !pre.rawmaterialupdatestaus }))
  const deliveryUpdateMt = () =>
    setDatas((pre) => ({ ...pre, deliveryupdatestaus: !pre.deliveryupdatestaus }))
  const employeeUpdateMt = () =>
    setDatas((pre) => ({ ...pre, employeeupdatestaus: !pre.employeeupdatestaus }))
  const productionUpdateMt = () =>
    setDatas((pre) => ({ ...pre, productionupdatestaus: !pre.productionupdatestaus }))
  const usedmaterialUpdateMt = () =>
    setDatas((pre) => ({ ...pre, usedmaterialupdatestaus: !pre.usedmaterialupdatestaus }))
  const storageUpdateMt = () =>
    setDatas((pre) => ({ ...pre, storageupdatestaus: !pre.storageupdatestaus }))
  const spendingUpdateMt = () =>
    setDatas((pre) => ({ ...pre, spendingupdatestatus: !pre.spendingupdatestatus }))
  const freezerboxUpdateMt = () =>
    setDatas((pre) => ({ ...pre, freezerboxstatus: !pre.freezerboxstatus }))

  // get table datas 'project list'
  useEffect(() => {
    const fetchData = async () => {
      const { product, status } = await getproduct()

      if (status) {
        setDatas((pre) => ({ ...pre, product }))
      }
    }
    fetchData()
  }, [datas.projectupdatestaus])

  // get table datas 'supplier list'
  useEffect(() => {
    const fetchData = async () => {
      const { supplier, status } = await getSupplier()
      if (status) {
        let supplierWithItems = await Promise.all(
          supplier.map(async (data) => ({ ...data, ...(await getMaterialDetailsById(data.id)) }))
        )
        setDatas((pre) => ({ ...pre, suppliers: supplierWithItems }))
      }
    }
    fetchData()
  }, [datas.supplierupdatestaus])

  // get table datas 'customer list'
  useEffect(() => {
    const fetchData = async () => {
      const { customer, status } = await getCustomer()
      if (status) {
        setDatas((pre) => ({ ...pre, customers: customer }))
      }
    }
    fetchData()
  }, [datas.customerupdatestaus])

  // get table datas 'raw material list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, rawmaterial } = await getRawmaterial()
      if (status) {
        const sortedRawmaterial = await latestFirstSort(rawmaterial)
        setDatas((pre) => ({ ...pre, rawmaterials: sortedRawmaterial }))
      }
    }
    fetchData()
  }, [datas.rawmaterialupdatestaus])

  // get table datas 'production list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, production } = await getProduction()
      if (status) {
        const sortedProduction = await latestFirstSort(production)
        setDatas((pre) => ({ ...pre, productions: sortedProduction }))
      }
    }
    fetchData()
  }, [datas.productionupdatestaus])

  // get table datas 'delivery list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, delivery } = await getDelivery()
      if (status) {
        const sortedDelivery = await latestFirstSort(delivery)
        setDatas((pre) => ({ ...pre, delivery: sortedDelivery }))
      }
    }
    fetchData()
  }, [datas.deliveryupdatestaus])

  // get table datas 'employee list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, employee } = await getEmployee()
      if (status) {
        setDatas((pre) => ({ ...pre, employees: employee }))
      }
    }
    fetchData()
  }, [datas.employeeupdatestaus])

  // get table datas 'storage list'
  useEffect(() => {
    const fetchData = async () => {
      const { status, storage } = await getStorage()
      if (status) {
        setDatas((pre) => ({ ...pre, storage }))
      }
    }
    fetchData()
  }, [datas.storageupdatestaus])

  // get table datas 'balace sheet'
  useEffect(() => {
    const fetchData = async () => {
      const { balancesheet, status } = await getBalanceSheet()
      if (status) {
        setDatas((pre) => ({ ...pre, balancesheet: balancesheet }))
      }
    }
    fetchData()
  }, [datas.balancesheetstatus])

  // get table datas 'freezerbox'
  useEffect(() => {
    const fetchData = async () => {
      const { freezerbox, status } = await getFreezerbox()
      if (status) {
        setDatas((pre) => ({ ...pre, freezerbox: freezerbox }))
      }
    }
    fetchData()
  }, [datas.freezerboxstatus])

  // get table datas 'Spending'
  useEffect(() => {
    const fetchData = async () => {
      const { spending, status } = await getSpending()
      if (status) {
        setDatas((pre) => ({ ...pre, spending: spending }))
      }
      console.log(spending)
    }
    fetchData()
  }, [datas.spendingupdatestatus])

  // Notification logic
  useEffect(() => {
    const storageAlert = async () => {
      const closeAllNotifications = () => {
        notification.destroy()
      }
      for (const record of datas.storage) {
        if (record.category === 'Product List') {
          try {
            const { product, status } = await getProductById(record.productid)
            if (status === 200 && record.numberofpacks < record.alertcount) {
              notification.warning({
                message: 'Alert',
                duration: 0,
                btn: (
                  <Button
                    style={{ color: '#f26723' }}
                    type="link"
                    size="small"
                    onClick={closeAllNotifications}
                  >
                    Close All
                  </Button>
                ),
                description: `${product.productname} has less number of pieces ${record.numberofpacks} than the alert count ${record.alertcount}!`
              })
            }
          } catch (error) {
            console.error('Failed to fetch product details for alert', error)
          }
        } else {
          if (record.quantity < record.alertcount) {
            notification.warning({
              message: 'Alert',
              duration: 0,
              btn: (
                <Button
                  style={{ color: '#f26723' }}
                  type="link"
                  size="small"
                  onClick={closeAllNotifications}
                >
                  Close All
                </Button>
              ),
              description: `${record.materialname} has less number of pieces ${record.quantity} than the alert count ${record.alertcount}!`
            })
          }
        }
      }
    }
    storageAlert()
  }, [datas.storage])

  useEffect(() => {
    const today = dayjs().format('DD/MM/YYYY')
    const tomorrow = dayjs().add(1, 'day').format('DD/MM/YYYY')
    const dayAfterTomorrow = dayjs().add(2, 'day').format('DD/MM/YYYY')
    const closeAllNotifications = () => {
      notification.destroy()
    }
    datas.delivery.forEach((record) => {
      if (record.type === 'booking' && !record.isdeleted && !record.bookingstatus) {
        if (
          record.deliverydate === today ||
          record.deliverydate === tomorrow ||
          record.deliverydate === dayAfterTomorrow
        ) {
          notification.info({
            message: 'Alert',
            icon: <FaBoxesPacking style={{ color: '#f26723' }} />,
            duration: 0,
            description: `${record.customername} have a booking on ${record.deliverydate} ${record.time}!`,
            btn: (
              <Button
                style={{ color: '#f26723' }}
                type="link"
                size="small"
                onClick={closeAllNotifications}
              >
                Close All
              </Button>
            )
          })
        }
      }
    })
  }, [datas.delivery])

  return (
    <main className="grid grid-cols-8 lg:grid-cols-12 w-full h-screen">
      <NavBar
        deliveryUpdateMt={deliveryUpdateMt}
        datas={datas}
        navPages={navPages}
        setNavPages={setNavPages}
        storageUpdateMt={storageUpdateMt}
        spendingUpdateMt={spendingUpdateMt}
      />
      <Pages
        datas={datas}
        productUpdateMt={productUpdateMt}
        supplierUpdateMt={supplierUpdateMt}
        customerUpdateMt={customerUpdateMt}
        rawmaterialUpdateMt={rawmaterialUpdateMt}
        deliveryUpdateMt={deliveryUpdateMt}
        employeeUpdateMt={employeeUpdateMt}
        productionUpdateMt={productionUpdateMt}
        usedmaterialUpdateMt={usedmaterialUpdateMt}
        storageUpdateMt={storageUpdateMt}
        navPages={navPages}
        freezerboxUpdateMt={freezerboxUpdateMt}
      />
    </main>
  )
}

export default App
