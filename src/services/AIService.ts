import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface AIAnalysis {
  summary: string
  insights: string[]
  suggestedFormulas: { cell: string; formula: string; description: string }[]
  patterns: string[]
}

export interface AICompletion {
  suggestions: string[]
  confidence: number
}

class AIService {
  private genAI: GoogleGenerativeAI | null = null
  private model: GenerativeModel | null = null

  constructor() {
    // Get Gemini API key from environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini-api-key')
    
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    }
  }

  setApiKey(key: string) {
    localStorage.setItem('gemini-api-key', key)
    this.genAI = new GoogleGenerativeAI(key)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async analyzeData(cells: Record<string, { value: string; formula?: string }>): Promise<AIAnalysis> {
    if (!this.model) {
      return this.getMockAnalysis(cells)
    }

    try {
      // Extract data for analysis
      const data = Object.entries(cells)
        .filter(([, cell]) => cell.value && cell.value.trim())
        .map(([key, cell]) => ({ cell: key, value: cell.value, formula: cell.formula }))

      const prompt = `Analyze this spreadsheet data and provide insights, patterns, and recommendations in JSON format:
              
Data: ${JSON.stringify(data, null, 2)}

Please respond with a JSON object containing:
- summary: brief overview of the data
- insights: array of 3-5 key insights
- patterns: array of detected patterns
- suggestedFormulas: array of objects with cell, formula, and description

Keep responses concise and practical.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        // Try to parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch {
        console.warn('Failed to parse AI response as JSON, using mock data')
      }
      
      return this.getMockAnalysis(cells)
    } catch (error) {
      console.error('AI Analysis failed:', error)
      return this.getMockAnalysis(cells)
    }
  }

  async suggestCompletion(value: string, context: string[]): Promise<AICompletion> {
    if (!this.model) {
      return this.getMockCompletion(value, context)
    }

    try {
      const prompt = `Given this context: ${JSON.stringify(context)}
              
Suggest 2-3 completions for the partial text: "${value}"

Respond with JSON: {"suggestions": ["suggestion1", "suggestion2"], "confidence": 0.8}`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch {
        console.warn('Failed to parse AI completion response')
      }
      
      return this.getMockCompletion(value, context)
    } catch (error) {
      console.error('AI Completion failed:', error)
      return this.getMockCompletion(value, context)
    }
  }

  async generateFormula(description: string, availableCells: string[]): Promise<string> {
    if (!this.model) {
      return this.getMockFormula(description)
    }

    try {
      const prompt = `Generate a spreadsheet formula for: "${description}"
              
Available cells: ${availableCells.join(', ')}

Return only the formula (starting with =) without any explanation.`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const formula = response.text().trim()
      
      return formula.startsWith('=') ? formula : `=${formula}`
    } catch (error) {
      console.error('AI Formula generation failed:', error)
      return this.getMockFormula(description)
    }
  }

  async fillPattern(selectedRange: string[], existingValues: string[]): Promise<string[]> {
    if (!this.model) {
      return this.getMockPattern(selectedRange, existingValues)
    }

    try {
      const prompt = `Given these existing values: ${JSON.stringify(existingValues)}
              
Continue the pattern for ${selectedRange.length} more values.

Respond with JSON array: ["value1", "value2", ...]`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      
      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch {
        console.warn('Failed to parse AI pattern response')
      }
      
      return this.getMockPattern(selectedRange, existingValues)
    } catch (error) {
      console.error('AI Pattern fill failed:', error)
      return this.getMockPattern(selectedRange, existingValues)
    }
  }

  private getMockAnalysis(cells: Record<string, { value: string; formula?: string }>): AIAnalysis {
    const data = Object.entries(cells)
      .filter(([, cell]) => cell.value && cell.value.trim())
      .map(([key, cell]) => ({ cell: key, value: cell.value, formula: cell.formula }))

    return {
      summary: `Analyzed ${data.length} cells with data. Found ${data.filter(d => d.formula).length} formulas.`,
      insights: [
        'Data appears to be financial/inventory related',
        'Most values are numeric',
        'Some cells contain formulas for calculations'
      ],
      suggestedFormulas: [
        { cell: 'E1', formula: '=AVERAGE(B:B)', description: 'Average of column B' },
        { cell: 'E2', formula: '=MAX(C:C)', description: 'Maximum value in column C' },
        { cell: 'E3', formula: '=COUNT(A:A)', description: 'Count non-empty cells in column A' }
      ],
      patterns: [
        'Sequential numbering detected in rows',
        'Calculation pattern found in formulas',
        'Product catalog structure identified'
      ]
    }
  }

  private getMockCompletion(value: string, context: string[]): AICompletion {
    const suggestions: string[] = []
    
    // Basic pattern matching
    if (value.toLowerCase().includes('prod')) {
      suggestions.push('Product Name', 'Product ID', 'Product Category')
    }
    if (value.toLowerCase().includes('price')) {
      suggestions.push('Price', 'Unit Price', 'Total Price')
    }
    if (value.toLowerCase().includes('qu')) {
      suggestions.push('Quantity', 'Quality', 'Quarter')
    }
    if (!isNaN(Number(value)) && context.some(c => !isNaN(Number(c)))) {
      // Suggest next number in sequence
      const numbers = context.filter(c => !isNaN(Number(c))).map(Number)
      if (numbers.length > 1) {
        const diff = numbers[numbers.length - 1] - numbers[numbers.length - 2]
        suggestions.push(String(Number(value) + diff))
      }
    }

    return {
      suggestions: suggestions.slice(0, 3),
      confidence: 0.8
    }
  }

  private getMockFormula(description: string): string {
    const desc = description.toLowerCase()
    
    if (desc.includes('sum') || desc.includes('total')) {
      return '=SUM(A1:A10)'
    } else if (desc.includes('average') || desc.includes('mean')) {
      return '=AVERAGE(A1:A10)'
    } else if (desc.includes('count')) {
      return '=COUNT(A1:A10)'
    } else if (desc.includes('max') || desc.includes('maximum')) {
      return '=MAX(A1:A10)'
    } else if (desc.includes('min') || desc.includes('minimum')) {
      return '=MIN(A1:A10)'
    } else {
      return '=A1*B1'
    }
  }

  private getMockPattern(selectedRange: string[], existingValues: string[]): string[] {
    const results: string[] = []
    
    // Check for numeric sequence
    const numbers = existingValues.filter(v => !isNaN(Number(v))).map(Number)
    if (numbers.length >= 2) {
      const diff = numbers[numbers.length - 1] - numbers[numbers.length - 2]
      let nextNum = numbers[numbers.length - 1]
      
      for (let i = 0; i < selectedRange.length; i++) {
        nextNum += diff
        results.push(String(nextNum))
      }
    } else if (existingValues.some(v => v.toLowerCase().includes('product'))) {
      // Generate product names
      for (let i = 0; i < selectedRange.length; i++) {
        results.push(`Product ${existingValues.length + i + 1}`)
      }
    } else {
      // Default pattern
      for (let i = 0; i < selectedRange.length; i++) {
        results.push(`Item ${i + 1}`)
      }
    }
    
    return results
  }
}

export const aiService = new AIService()
