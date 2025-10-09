import { Modal, Table } from 'antd'

interface AttributeModalProps {
  open: boolean
  onClose: () => void
  attributes: Record<string, any>
}

const columns = [
  {
    title: 'Özellik',
    dataIndex: 'name',
    key: 'name'
  },
  {
    title: 'Değer',
    dataIndex: 'value',
    key: 'value',
    render: (value: any) => {
      if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır'
      return value
    }
  }
]

const AttributeModal = ({ open, onClose, attributes }: AttributeModalProps) => {
  const dataSource = attributes
    ? Object.entries(attributes).map(([key, value]) => ({
        key,
        name: key,
        value
      }))
    : []

  return (
    <Modal title="Özellikler" open={open} onCancel={onClose} footer={null} width={600}>
      <Table columns={columns} dataSource={dataSource} pagination={false} size="small" />
    </Modal>
  )
}

export default AttributeModal
