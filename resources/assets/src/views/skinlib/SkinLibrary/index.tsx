import React, { useState, useEffect } from 'react'
import { hot } from 'react-hot-loader/root'
import useBlessingExtra from '@/scripts/hooks/useBlessingExtra'
import useEmitMounted from '@/scripts/hooks/useEmitMounted'
import { t } from '@/scripts/i18n'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import { Paginator, TextureType } from '@/scripts/types'
import urls from '@/scripts/urls'
import Loading from '@/components/Loading'
import Pagination from '@/components/Pagination'
import addClosetItem from '../Show/addClosetItem'
import removeClosetItem from '@/views/user/Closet/removeClosetItem'
import FilterSelector from './FilterSelector'
import Item from './Item'
import type { Filter, LibraryItem } from './types'

// Import modern styles
import '@/styles/skinlib-modern.css'

const SkinLibrary: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [items, setItems] = useState<LibraryItem[]>([])
  const [closet, setCloset] = useState<number[]>([])
  const [filter, setFilter] = useState<Filter>('skin')
  const [name, setName] = useState('')
  const [keyword, setKeyword] = useState('')
  const [uploader, setUploader] = useState<number | null>(0)
  const [sort, setSort] = useState('time')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const currentUid = useBlessingExtra<number | null>('currentUid', null)

  useEmitMounted()

  useEffect(() => {
    const parseSearch = (query: string) => {
      const search = new URLSearchParams(query)

      const filter = search.get('filter') ?? ''
      setFilter(
        [
          'skin',
          TextureType.Steve,
          TextureType.Alex,
          TextureType.Cape,
        ].includes(filter)
          ? (filter as Filter)
          : 'skin',
      )

      const keyword = decodeURIComponent(search.get('keyword') ?? '')
      setName(keyword)
      setKeyword(keyword)

      const uploader = search.get('uploader') ?? '0'
      setUploader(Number.parseInt(uploader))

      setSort(search.get('sort') ?? 'time')

      setPage(Number.parseInt(search.get('page') ?? '1'))
    }

    parseSearch(location.search)

    const handler = (event: PopStateEvent) => parseSearch(event.state)
    window.addEventListener('popstate', handler)

    return () => {
      window.removeEventListener('popstate', handler)
    }
  }, [])

  useEffect(() => {
    const getItems = async () => {
      setIsLoading(true)

      const search = new URLSearchParams()
      search.append('filter', filter)
      if (keyword) {
        search.append('keyword', keyword)
      }
      if (uploader) {
        search.append('uploader', uploader.toString())
      }
      search.append('sort', sort)
      search.append('page', page.toString())
      window.history.pushState(search.toString(), '', `?${search}`)

      const result = await fetch.get<Paginator<LibraryItem>>(
        urls.skinlib.list(),
        search,
      )
      setItems(result.data)
      setTotalPages(result.last_page)
      setIsLoading(false)
    }
    getItems()
  }, [filter, keyword, uploader, sort, page])

  useEffect(() => {
    const getCloset = async () => {
      const closet = await fetch.get<number[]>(urls.user.closet.ids())
      setCloset(closet)
    }
    if (currentUid) {
      getCloset()
    }
  }, [currentUid])

  const handleFilterChange = (filter: Filter) => {
    setFilter(filter)
    setPage(1)
  }

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setKeyword(name)
    setPage(1)
  }

  const handleLikesSortClick = () => setSort('likes')
  const handleTimeSortClick = () => setSort('time')
  const handleSelfUploadClick = () => {
    setUploader(currentUid)
    setPage(1)
  }
  const handleResetClick = () => {
    setFilter('skin')
    setName('')
    setKeyword('')
    setSort('time')
    setUploader(0)
    setPage(1)
  }

  const handleUploaderClick = (uploaderUid: number) => {
    setUploader(uploaderUid)
    setPage(1)
  }

  const handleAddToCloset = async (item: LibraryItem, index: number) => {
    if (!currentUid) {
      toast.warning(t('skinlib.anonymous'))
      return
    }

    const ok = await addClosetItem(item)
    if (ok) {
      setCloset((closet) => [...closet, item.tid])
      setItems((items) => {
        items[index] = { ...item, likes: item.likes + 1 }
        return items.slice()
      })
    }
  }

  const handleRemoveFromCloset = async (item: LibraryItem, index: number) => {
    const ok = await removeClosetItem(item.tid)
    if (ok) {
      setCloset((closet) => closet.filter((id) => id !== item.tid))
      setItems((items) => {
        items[index] = { ...item, likes: item.likes - 1 }
        return items.slice()
      })
    }
  }

  return (
    <div className="skinlib-wrapper">
      <div className="container">
        {/* Header */}
        <div className="skinlib-header d-flex justify-content-between align-items-center">
          <h1>{t('general.skinlib')}</h1>
          <span className="skinlib-uploader-badge">
            {uploader ? (
              <>
                <i className="fas fa-user" style={{ fontSize: '0.75em' }} />
                {t('skinlib.filter.uploader', { uid: uploader })}
              </>
            ) : (
              <>
                <i className="fas fa-globe" style={{ fontSize: '0.75em' }} />
                {t('skinlib.filter.allUsers')}
              </>
            )}
          </span>
        </div>

        {/* Toolbar */}
        <div className="skinlib-toolbar">
          {/* Search form */}
          <form className="skinlib-search-form" onSubmit={handleFormSubmit}>
            <input
              type="text"
              inputMode="search"
              className="skinlib-search-input"
              value={name}
              placeholder={t('vendor.datatable.search')}
              onChange={handleNameChange}
            />
            <button
              className="skinlib-search-btn"
              type="submit"
              title={t('vendor.datatable.search')}
            >
              <i className="fas fa-search" />
            </button>
          </form>

          {/* Filter chips */}
          <div className="skinlib-chips">
            <FilterSelector filter={filter} onChange={handleFilterChange} />

            <div className="skinlib-chips-divider" />

            {/* Sort chips */}
            <button
              className={`skinlib-chip${sort === 'time' ? ' active' : ''}`}
              onClick={handleTimeSortClick}
            >
              <i className="fas fa-clock" style={{ fontSize: '0.75em' }} />
              {t('skinlib.sort.time')}
            </button>
            <button
              className={`skinlib-chip${sort === 'likes' ? ' active' : ''}`}
              onClick={handleLikesSortClick}
            >
              <i className="fas fa-heart" style={{ fontSize: '0.75em' }} />
              {t('skinlib.sort.likes')}
            </button>

            {currentUid !== null && (
              <>
                <div className="skinlib-chips-divider" />
                <button
                  className={`skinlib-chip${
                    uploader === currentUid ? ' active' : ''
                  }`}
                  onClick={handleSelfUploadClick}
                >
                  <i className="fas fa-user" style={{ fontSize: '0.75em' }} />
                  {t('skinlib.seeMyUpload')}
                </button>
              </>
            )}

            {/* Reset */}
            <button
              className="skinlib-chip danger"
              onClick={handleResetClick}
              title={t('skinlib.reset')}
            >
              <i className="fas fa-times" style={{ fontSize: '0.75em' }} />
              {t('skinlib.reset')}
            </button>
          </div>
        </div>

        {/* Grid / Content area */}
        <div style={{ position: 'relative' }}>
          {items.length > 0 ? (
            <div className="skinlib-grid">
              {items.map((item, i) => (
                <Item
                  key={item.tid}
                  item={item}
                  liked={closet.includes(item.tid)}
                  onAdd={(item) => handleAddToCloset(item, i)}
                  onRemove={(item) => handleRemoveFromCloset(item, i)}
                  onUploaderClick={handleUploaderClick}
                />
              ))}
            </div>
          ) : (
            !isLoading && (
              <div className="skinlib-grid">
                <div className="skinlib-empty">
                  <div className="skinlib-empty-icon">
                    <i className="fas fa-image" />
                  </div>
                  <p className="skinlib-empty-text">{t('general.noResult')}</p>
                </div>
              </div>
            )
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '280px',
              }}
            >
              <div className="skinlib-spinner" />
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="skinlib-pagination">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  )
}

export default hot(SkinLibrary)
