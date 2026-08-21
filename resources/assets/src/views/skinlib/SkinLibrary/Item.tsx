import React from 'react'
import { t } from '@/scripts/i18n'
import type { LibraryItem } from './types'
import { humanizeType } from './utils'

interface Props {
  item: LibraryItem
  liked: boolean
  onAdd(texture: LibraryItem): Promise<void>
  onRemove(texture: LibraryItem): Promise<void>
  onUploaderClick(uploader: number): void
}

const Item: React.FC<Props> = (props) => {
  const { item } = props

  const link = `${blessing.base_url}/skinlib/show/${item.tid}`
  const preview = `${blessing.base_url}/preview/${item.tid}?height=150`
  const previewPNG = `${preview}&png`

  const handleUploaderClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    props.onUploaderClick(item.uploader)
  }

  const handleHeartClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    props.liked ? props.onRemove(item) : props.onAdd(item)
  }

  return (
    <a href={link} className="skinlib-card-link" target="_blank">
      <div className="skinlib-card">
        {/* Preview area */}
        <div className="skinlib-card-preview">
          {/* Private lock badge */}
          {!item.public && (
            <div className="skinlib-private-badge" title={t('skinlib.private')}>
              <i className="fas fa-lock" />
            </div>
          )}

          {/* Skin preview image */}
          <picture>
            <source srcSet={preview} type="image/webp" />
            <img src={previewPNG} alt={item.name} />
          </picture>

          {/* Hover overlay */}
          <div className="skinlib-card-overlay">
            <div className="skinlib-card-overlay-actions">
              <a
                href={link}
                target="_blank"
                className="skinlib-card-overlay-btn"
                onClick={(e) => e.stopPropagation()}
              >
                <i className="fas fa-eye mr-1" />
                {t('skinlib.show.detail')}
              </a>
              <button
                className={`skinlib-card-overlay-btn${
                  props.liked ? ' liked' : ''
                }`}
                onClick={handleHeartClick}
                title={
                  props.liked
                    ? t('skinlib.removeFromCloset')
                    : t('skinlib.addToCloset')
                }
              >
                <i className={`fas fa-heart mr-1`} />
                {item.likes}
              </button>
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="skinlib-card-info">
          <div className="skinlib-card-name" title={item.name}>
            {item.name}
          </div>
          <div className="skinlib-card-meta">
            <div style={{ display: 'flex', gap: '5px', overflow: 'hidden' }}>
              <span className="skinlib-tag skinlib-tag-type">
                {humanizeType(item.type)}
              </span>
              <span
                className="skinlib-tag skinlib-tag-uploader"
                title={t('skinlib.show.uploader')}
                onClick={handleUploaderClick}
              >
                {item.nickname}
              </span>
            </div>
            {/* Like button (always visible on desktop) */}
            <button
              className={`skinlib-like-btn${props.liked ? ' liked' : ''}`}
              onClick={handleHeartClick}
              title={
                props.liked
                  ? t('skinlib.removeFromCloset')
                  : t('skinlib.addToCloset')
              }
            >
              <i className="fas fa-heart" />
              <span>{item.likes}</span>
            </button>
          </div>
        </div>
      </div>
    </a>
  )
}

export default Item
