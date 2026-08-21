import React from 'react'
import { t } from '@/scripts/i18n'
import { TextureType } from '@/scripts/types'
import type { Filter } from './types'
import { humanizeType } from './utils'

interface Props {
  filter: Filter
  onChange(filter: Filter): void
}

const FILTERS: { value: Filter; label: string; icon: string }[] = [
  { value: 'skin', label: '', icon: 'fas fa-user' },
  { value: TextureType.Steve, label: 'Steve', icon: 'fas fa-male' },
  { value: TextureType.Alex, label: 'Alex', icon: 'fas fa-female' },
  { value: TextureType.Cape, label: '', icon: 'fas fa-shield-alt' },
]

const FilterSelector: React.FC<Props> = ({ filter, onChange }) => {
  return (
    <>
      {FILTERS.map(({ value, label, icon }) => {
        const displayLabel = label || humanizeType(value)
        return (
          <button
            key={value}
            className={`skinlib-chip${filter === value ? ' active' : ''}`}
            onClick={() => onChange(value)}
            title={displayLabel}
          >
            <i className={icon} style={{ fontSize: '0.75em' }} />
            {displayLabel}
          </button>
        )
      })}
    </>
  )
}

export default FilterSelector
