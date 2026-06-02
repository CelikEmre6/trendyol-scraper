import { Modal, Table, Tag } from 'antd'

interface StockModalProps {
  open: boolean
  onClose: () => void
  sizes: any[]
}

const columns = [
  {
    title: 'Ürün Kodu',
    dataIndex: 'itemNumber',
    key: 'itemNumber'
  },
  {
    title: 'Beden',
    dataIndex: 'beden',
    key: 'beden'
  },
  {
    title: 'Stok Durumu',
    dataIndex: 'inStock',
    key: 'inStock',
    render: (inStock: any) => {
      const isAvailable = inStock === true || inStock === 'Stokta var'
      return isAvailable ? (
        <Tag color="success">Var</Tag>
      ) : (
        <Tag color="error">Yok</Tag>
      )
    }
  }
]

const StockModal = ({ open, onClose, sizes }: StockModalProps) => {
  return (
    <Modal title="Stok Durumu" open={open} onCancel={onClose} footer={null} width={600}>
      <Table 
        columns={columns} 
        dataSource={sizes} 
        pagination={false} 
        size="small" 
        rowKey="itemNumber"
      />
    </Modal>
  )
}

export default StockModal
