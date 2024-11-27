import './assets/main.css'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { getDate } from './firebase/companyfirebase'
import { ConfigProvider, Modal, App as AntdApp } from 'antd'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const theme = {
  token: {
    colorPrimary: '#f26723'
  }
}

const Main = () => {
  const [isValidDate, setIsValidDate] = useState(false)

  useEffect(() => {
    const checkDate = async () => {
      const { expirydata, status } = await getDate()
      if (status === 200 && expirydata.length > 0) {
        const expirydateStr = expirydata[0].date
        const expirydate = dayjs(expirydateStr, 'DD/MM/YYYY')
        const today = dayjs()
        if (expirydate.isAfter(today)) {
          setIsValidDate(true)
        } else {
          Modal.info({
            title: 'Expired',
            content: `Application expired on ${expirydate.format('DD/MM/YYYY')}`,
            centered: true,
            onOk: () => window.location.reload()
          })
        }
      } else {
        Modal.error({
          title: 'Error',
          content: 'Internet Issue or Contact Admin.',
          onOk: () => window.location.reload()
        })
      }
    }

    checkDate()
  }, [])

  return (
    <ConfigProvider theme={theme} getPopupContainer={() => document.getElementById('root')}>
      <AntdApp>{isValidDate ? <App /> : null}</AntdApp>
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />)
