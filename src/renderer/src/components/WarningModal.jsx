import { Modal } from 'antd'
import React from 'react'
import { PiWarningCircleFill } from 'react-icons/pi'
export default function WarningModal({state,cancel,ok}) {
  return (
<Modal
        width={300}
        centered={true}
        title={
          <span className="flex gap-x-1 justify-center items-center">
            <PiWarningCircleFill className="text-yellow-500 text-xl" /> Warning
          </span>
        }
        open={state}
        zIndex={1001}
        onOk={ok}
        onCancel={cancel}
        okText="OK"
        cancelText="Cancel"
        className="center-buttons-modal"
      >
        <p className="text-center">Are you sure you want to cancel?</p>
      </Modal>
  )
}
