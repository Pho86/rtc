import { useState, useCallback, useMemo, useEffect } from 'react'
import { SpreadsheetToolbar } from './SpreadsheetToolbar'
import { LanguageSelector } from './LanguageSelector'
import { AIAssistant } from './AIAssistant'
import { translationService } from '../services/TranslationService'
import { aiService } from '../services/AIService'
import type { Language, TranslationMode } from '../services/TranslationService'

interface Cell {
  value: string
  formula?: string
  computedValue?: string | number
}

interface SpreadsheetProps {
  rows?: number
  cols?: number
}

export function Spreadsheet({ rows: initialRows = 20, cols: initialCols = 26 }: SpreadsheetProps) {
  const [cells, setCells] = useState<Record<string, Cell>>({})
  const [selectedCell, setSelectedCell] = useState<string>('A1')
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [rows, setRows] = useState(initialRows)
  const [cols, setCols] = useState(initialCols)
  
  // Translation state
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en')
  const [currentMode, setCurrentMode] = useState<TranslationMode>(
    translationService.getTranslationModes()[0] // Auto Khmer by default
  )
  const [isTranslating, setIsTranslating] = useState(false)

  // Generate column headers (A, B, C, ...)
  const columnHeaders = useMemo(() => {
    return Array.from({ length: cols }, (_, i) => 
      String.fromCharCode(65 + i)
    )
  }, [cols])

  // Generate row headers (1, 2, 3, ...)
  const rowHeaders = useMemo(() => {
    return Array.from({ length: rows }, (_, i) => i + 1)
  }, [rows])

  // Get cell value with formula evaluation
  const getCellValue = useCallback((cellKey: string): string => {
    const cell = cells[cellKey]
    if (!cell) return ''
    
    if (cell.formula) {
      return cell.computedValue?.toString() || ''
    }
    
    return cell.value
  }, [cells])

  // Get values from a range
  const getRangeValues = useCallback((start: string, end: string): (string | number)[] => {
    const values: (string | number)[] = []
    const [startCol, startRow] = [start.match(/[A-Z]+/)![0], parseInt(start.match(/\d+/)![0])]
    const [endCol, endRow] = [end.match(/[A-Z]+/)![0], parseInt(end.match(/\d+/)![0])]
    
    const startColIndex = startCol.charCodeAt(0) - 65
    const endColIndex = endCol.charCodeAt(0) - 65
    
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startColIndex; col <= endColIndex; col++) {
        const cellKey = `${String.fromCharCode(65 + col)}${row}`
        values.push(getCellValue(cellKey))
      }
    }
    
    return values
  }, [getCellValue])

  // Evaluate formula
  const evaluateFormula = useCallback((formula: string): string | number => {
    try {
      // Remove the = sign
      const expression = formula.substring(1)
      
      // Handle SUM function
      if (expression.startsWith('SUM(')) {
        const range = expression.match(/SUM\(([A-Z]+\d+):([A-Z]+\d+)\)/)
        if (range) {
          const [start, end] = range.slice(1)
          const values = getRangeValues(start, end)
          return values.reduce((sum: number, val) => sum + (Number(val) || 0), 0)
        }
      }
      
      // Handle basic arithmetic
      const cleanExpression = expression.replace(/[A-Z]+\d+/g, (match) => {
        const cellValue = getCellValue(match)
        return String(Number(cellValue) || 0)
      })
      
      // eslint-disable-next-line no-eval
      return eval(cleanExpression)
    } catch {
      return '#ERROR!'
    }
  }, [getCellValue, getRangeValues])

  // Update cell value with translation
  const updateCell = useCallback(async (cellKey: string, value: string) => {
    const newCells = { ...cells }
    
    if (value.startsWith('=')) {
      // Formula - don't translate
      newCells[cellKey] = {
        value: value,
        formula: value,
        computedValue: evaluateFormula(value)
      }
    } else {
      // Regular value - apply translation if mode is active
      let finalValue = value
      
      if (currentMode.autoTranslate && value.trim()) {
        try {
          setIsTranslating(true)
          const translation = await translationService.translate(value, currentMode.targetLang)
          if (translation.confidence && translation.confidence > 0.5) {
            finalValue = translation.text
            console.log(`Translated "${value}" to "${finalValue}" (confidence: ${translation.confidence})`)
          }
        } catch (error) {
          console.error('Translation failed:', error)
        } finally {
          setIsTranslating(false)
        }
      }
      
      newCells[cellKey] = { value: finalValue }
    }
    
    setCells(newCells)
  }, [cells, evaluateFormula, currentMode])

  // Handle cell click
  const handleCellClick = useCallback((cellKey: string) => {
    setSelectedCell(cellKey)
    setEditingCell(cellKey)
    setEditValue(cells[cellKey]?.value || '')
  }, [cells])

  // Start editing a cell
  const startEditingCell = useCallback((cellKey: string) => {
    setSelectedCell(cellKey)
    setEditingCell(cellKey)
    setEditValue(cells[cellKey]?.value || '')
  }, [cells])

  // AI Automation handlers
  const handleSmartCompletion = useCallback(async (cellKey: string, value: string) => {
    if (value.length > 2) {
      try {
        // Get context from nearby cells
        const [col, row] = [cellKey.match(/[A-Z]+/)![0], parseInt(cellKey.match(/\d+/)![0])]
        const context: string[] = []
        
        // Get values from same column (above current cell)
        for (let i = Math.max(1, row - 3); i < row; i++) {
          const contextCell = cells[`${col}${i}`]
          if (contextCell?.value) context.push(contextCell.value)
        }
        
        // Get values from same row (left of current cell)
        const colIndex = col.charCodeAt(0) - 65
        for (let i = Math.max(0, colIndex - 3); i < colIndex; i++) {
          const contextCell = cells[`${String.fromCharCode(65 + i)}${row}`]
          if (contextCell?.value) context.push(contextCell.value)
        }
        
        const completion = await aiService.suggestCompletion(value, context)
        
        if (completion.suggestions.length > 0 && completion.confidence > 0.7) {
          // Show suggestions (you could implement a dropdown here)
          console.log('AI Suggestions:', completion.suggestions)
        }
      } catch (error) {
        console.error('Smart completion failed:', error)
      }
    }
  }, [cells])

  // Handle cell edit
  const handleCellEdit = useCallback(async (cellKey: string, value: string) => {
    await updateCell(cellKey, value)
    setEditingCell(null)
    setEditValue('')
    
    // Trigger smart completion for future suggestions
    if (value && !value.startsWith('=')) {
      handleSmartCompletion(cellKey, value)
    }
  }, [updateCell, handleSmartCompletion])

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent, cellKey: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleCellEdit(cellKey, editValue)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      // Save current cell and move to next cell
      handleCellEdit(cellKey, editValue)
      
      // Move to next cell in the row
      const match = cellKey.match(/^([A-Z]+)(\d+)$/)
      if (match) {
        const col = match[1]
        const row = parseInt(match[2])
        const colIndex = col.charCodeAt(0) - 65
        const nextColIndex = colIndex + 1
        
        if (nextColIndex < cols) {
          const nextCell = `${String.fromCharCode(65 + nextColIndex)}${row}`
          startEditingCell(nextCell)
        }
      }
    }
  }, [editValue, handleCellEdit, cols, startEditingCell])

  // Navigate with arrow keys
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!editingCell) {
      const [col, row] = [selectedCell.match(/[A-Z]+/)![0], parseInt(selectedCell.match(/\d+/)![0])]
      const colIndex = col.charCodeAt(0) - 65
      
      let newCell = selectedCell
      
      switch (e.key) {
        case 'ArrowUp':
          if (row > 1) newCell = `${col}${row - 1}`
          break
        case 'ArrowDown':
          if (row < rows) newCell = `${col}${row + 1}`
          break
        case 'ArrowLeft':
          if (colIndex > 0) newCell = `${String.fromCharCode(65 + colIndex - 1)}${row}`
          break
        case 'ArrowRight':
          if (colIndex < cols - 1) newCell = `${String.fromCharCode(65 + colIndex + 1)}${row}`
          break
        case 'Enter':
          e.preventDefault()
          setEditingCell(selectedCell)
          setEditValue(cells[selectedCell]?.value || '')
          return
      }
      
      if (newCell !== selectedCell) {
        setSelectedCell(newCell)
      }
    }
  }, [selectedCell, editingCell, cells, rows, cols])

  // Data persistence
  useEffect(() => {
    const savedData = localStorage.getItem('rtc-spreadsheet-data')
    if (savedData) {
      try {
        setCells(JSON.parse(savedData))
      } catch (error) {
        console.error('Failed to load saved data:', error)
      }
    }
  }, [])

  // Language persistence
  useEffect(() => {
    const savedLanguage = localStorage.getItem('rtc-spreadsheet-language') as Language
    if (savedLanguage && ['en', 'km', 'ne'].includes(savedLanguage)) {
      setCurrentLanguage(savedLanguage)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('rtc-spreadsheet-data', JSON.stringify(cells))
  }, [cells])

  // Toolbar handlers
  const handleSave = useCallback(() => {
    const dataStr = JSON.stringify(cells)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'spreadsheet-data.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [cells])

  const handleLoad = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string)
            setCells(data)
          } catch (error) {
            console.error('Failed to parse file:', error)
            alert('Invalid file format')
          }
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }, [])

  const handleClear = useCallback(() => {
    if (confirm('Are you sure you want to clear all data?')) {
      setCells({})
    }
  }, [])

  const handleExport = useCallback(() => {
    // Export as CSV
    let csv = ''
    for (let row = 1; row <= rows; row++) {
      const rowData = []
      for (let col = 0; col < cols; col++) {
        const cellKey = `${String.fromCharCode(65 + col)}${row}`
        const value = getCellValue(cellKey)
        rowData.push(`"${value}"`)
      }
      csv += rowData.join(',') + '\n'
    }
    
    const dataBlob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'spreadsheet-export.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [rows, cols, getCellValue])

  // Grid size handlers
  const handleAddRow = useCallback(() => {
    setRows(prev => prev + 1)
  }, [])

  const handleAddColumn = useCallback(() => {
    setCols(prev => prev + 1)
  }, [])

  const handleSetRows = useCallback((newRows: number) => {
    if (newRows > 0 && newRows <= 100) {
      setRows(newRows)
    }
  }, [])

  const handleSetCols = useCallback((newCols: number) => {
    if (newCols > 0 && newCols <= 26) {
      setCols(newCols)
    }
  }, [])

  return (
    <div className="w-full h-full flex flex-col" onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Main Toolbar */}
      <SpreadsheetToolbar
        onSave={handleSave}
        onLoad={handleLoad}
        onClear={handleClear}
        onExport={handleExport}
        currentLanguage={currentLanguage}
      />
      
      {/* Cell Editor Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {translationService.translateUI('cell', currentLanguage)}:
            </span>
            <span className="text-sm bg-white px-2 py-1 border border-gray-300 rounded min-w-[60px]">
              {selectedCell}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              {translationService.translateUI('value', currentLanguage)}:
            </span>
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => handleKeyPress(e, selectedCell)}
              className="text-sm px-2 py-1 border border-gray-300 rounded min-w-[200px]"
              placeholder={translationService.translateUI('enter_formula', currentLanguage)}
            />
          </div>
          <button
            onClick={() => handleCellEdit(selectedCell, editValue)}
            disabled={isTranslating}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            {isTranslating && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{translationService.translateUI('apply', currentLanguage)}</span>
          </button>
          
          {/* Grid Size Controls */}
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-4">
            <span className="text-sm font-medium text-gray-700">Grid:</span>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={rows}
                onChange={(e) => handleSetRows(parseInt(e.target.value) || 1)}
                min="1"
                max="100"
                className="w-16 text-xs px-1 py-1 border border-gray-300 rounded text-center"
                title="Rows"
              />
              <span className="text-xs text-gray-500">×</span>
              <input
                type="number"
                value={cols}
                onChange={(e) => handleSetCols(parseInt(e.target.value) || 1)}
                min="1"
                max="26"
                className="w-16 text-xs px-1 py-1 border border-gray-300 rounded text-center"
                title="Columns"
              />
            </div>
            <button
              onClick={handleAddRow}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              title="Add Row"
            >
              +R
            </button>
            <button
              onClick={handleAddColumn}
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
              title="Add Column"
            >
              +C
            </button>
          </div>
        </div>
        
        {/* Language Selector */}
        <LanguageSelector
          currentLanguage={currentLanguage}
          currentMode={currentMode}
          onLanguageChange={setCurrentLanguage}
          onTranslationModeChange={setCurrentMode}
        />
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto">
        <div className="w-full">
          {/* Column Headers */}
          <div className="flex border-b border-gray-300 w-full">
            <div className="w-12 h-8 bg-gray-200 border-r border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
              {/* Empty corner cell */}
            </div>
            {columnHeaders.map((col) => (
              <div
                key={col}
                className="flex-1 min-w-[100px] h-8 bg-gray-200 border-r border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Rows */}
          {rowHeaders.map((row) => (
            <div key={row} className="flex border-b border-gray-300 w-full">
              {/* Row Header */}
              <div className="w-12 h-8 bg-gray-200 border-r border-gray-300 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                {row}
              </div>
              
              {/* Cells */}
              {columnHeaders.map((col) => {
                const cellKey = `${col}${row}`
                const isSelected = selectedCell === cellKey
                const isEditing = editingCell === cellKey
                const cellValue = getCellValue(cellKey)
                
                return (
                  <div
                    key={cellKey}
                    className={`flex-1 min-w-[100px] h-8 border-r border-gray-300 flex items-center px-1 cursor-pointer ${
                      isSelected ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleCellClick(cellKey)}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, cellKey)}
                        onBlur={() => handleCellEdit(cellKey, editValue)}
                        className="w-full h-full text-xs border-none outline-none bg-transparent"
                        autoFocus
                      />
                    ) : (
                      <span className="text-xs truncate w-full">
                        {cellValue}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* AI Assistant */}
      <AIAssistant
        cells={cells}
        onApplyFormula={(cell, formula) => updateCell(cell, formula)}
      />
    </div>
  )
}
