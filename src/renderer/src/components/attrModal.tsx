import { useSettings } from '@renderer/hooks/useSettings'
import { Button, Checkbox, Input, Modal, Spin } from 'antd'
import React, { useEffect, useState } from 'react'

interface AttrModalProps {
  open: boolean
  onClose: () => void
  onSave: (selected: string[]) => void
}

export const AttrModal: React.FC<AttrModalProps> = ({ open, onClose }) => {
  const { settings, handleUpdateSettings } = useSettings()
  const [loading, setLoading] = useState(false)
  const [attributes, setAttributes] = useState<string[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (open) {
      fetchAttributes()
      setSelected(settings?.attributes || [])
    }
  }, [open, settings?.attributes])

  const fetchAttributes = async () => {
    try {
      setLoading(true)
      const data = await window.context.getSearchAttributes()
      setAttributes(data.sort((a: string, b: string) => a.localeCompare(b)))
    } catch (err) {
      console.error('Attr fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    handleUpdateSettings({
      ...settings!,
      attributes: selected
    })
    onClose()
  }

  const handleCheckboxChange = (attr: string, checked: boolean) => {
    if (checked) {
      setSelected((prev) => [...prev, attr])
    } else {
      setSelected((prev) => prev.filter((item) => item !== attr))
    }
  }

  const filteredAttributes = attributes.filter((attr) =>
    attr.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Modal
      title="Attribute Seç"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          İptal
        </Button>,
        <Button key="save" type="primary" onClick={handleSave}>
          Kaydet
        </Button>
      ]}
    >
      {loading ? (
        <Spin />
      ) : (
        <>
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredAttributes.map((attr) => (
                <Checkbox
                  key={attr}
                  checked={selected.includes(attr)}
                  onChange={(e) => handleCheckboxChange(attr, e.target.checked)}
                >
                  {attr}
                </Checkbox>
              ))}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
