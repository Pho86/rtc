import { useState } from 'react'
import { aiService, type AIAnalysis } from '../services/AIService'

interface AIAssistantProps {
  cells: Record<string, { value: string; formula?: string }>
  onApplyFormula: (cell: string, formula: string) => void
  onUpdateCells: (updates: Record<string, string>) => void
}

export function AIAssistant({ 
  cells, 
  onApplyFormula, 
  onUpdateCells 
}: AIAssistantProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [showAI, setShowAI] = useState(false)
  const [formulaPrompt, setFormulaPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedFormula, setGeneratedFormula] = useState('')

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const result = await aiService.analyzeData(cells)
      setAnalysis(result)
    } catch (error) {
      console.error('AI Analysis failed:', error)
      alert('AI Analysis failed. Please check your API key.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateFormula = async () => {
    if (!formulaPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      const availableCells = Object.keys(cells)
      const formula = await aiService.generateFormula(formulaPrompt, availableCells)
      setGeneratedFormula(formula)
      onApplyFormula('A1', formula) // Apply to A1 by default, user can modify
    } catch (error) {
      console.error('Failed to generate formula:', error)
    }
    setIsGenerating(false)
  }

  const handleApplySuggestion = (cell: string, formula: string) => {
    onApplyFormula(cell, formula)
  }

  if (!showAI) {
    return (
      <button
        onClick={() => setShowAI(true)}
        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center space-x-1"
        title="AI Assistant"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>AI</span>
      </button>
    )
  }

  return (
    <div className="fixed top-20 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          AI Assistant
        </h3>
        <button
          onClick={() => setShowAI(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Data Analysis */}
      <div className="mb-4">
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center space-x-2"
        >
          {isAnalyzing ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )}
          <span>Analyze Data</span>
        </button>
      </div>

      {/* Formula Generator */}
      <div className="mb-4">
                <div className="space-y-4">
          <h3 className="text-lg font-semibold">Generate Formula:</h3>
          <input
            type="text"
            value={formulaPrompt}
            onChange={(e) => setFormulaPrompt(e.target.value)}
            placeholder="Describe what you want to calculate..."
            className="w-full p-2 border rounded"
          />
          <button
            onClick={handleGenerateFormula}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Formula'}
          </button>
          {generatedFormula && (
            <div className="p-3 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">Generated formula:</p>
              <code className="text-sm font-mono">{generatedFormula}</code>
            </div>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Summary:</h4>
            <p className="text-sm text-gray-600">{analysis.summary}</p>
          </div>

          {analysis.insights.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Insights:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {analysis.insights.map((insight: string, index: number) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.suggestedFormulas.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Suggested Formulas:</h4>
              <div className="space-y-2">
                {analysis.suggestedFormulas.map((suggestion: { cell: string; formula: string; description: string }, index: number) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs bg-gray-200 px-1 rounded">{suggestion.cell}</span>
                        <span className="ml-2 font-mono text-xs">{suggestion.formula}</span>
                        <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                      </div>
                      <button
                        onClick={() => handleApplySuggestion(suggestion.cell, suggestion.formula)}
                        className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.patterns.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Patterns Detected:</h4>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                {analysis.patterns.map((pattern: string, index: number) => (
                  <li key={index}>{pattern}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
