import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminCollectionHelpers } from '../../lib/pocketbase'
import { Plus, Save, Download, FileText, BarChart3, TrendingUp, PieChart as PieChartIcon, Table } from 'lucide-react'

interface SavedReport {
  id: string
  name: string
  description: string
  created_by: string
  last_run?: string
  [key: string]: any
}

export const CustomReports = () => {
  const [showBuilder, setShowBuilder] = useState(false)
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])

  // Report Builder State
  const [dataSource, setDataSource] = useState<string>('users')
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([])
  const [filters, setFilters] = useState<any[]>([])
  const [groupBy, setGroupBy] = useState<string>('')
  const [chartType, setChartType] = useState<'table' | 'bar' | 'line' | 'pie' | 'heatmap'>('table')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
      <h1 className="text-3xl font-bold text-neutral-dark">Custom Reports</h1>
          <p className="text-neutral-500 mt-1">Create ad-hoc reports with custom metrics and visualizations</p>
        </div>
        <button
          onClick={() => setShowBuilder(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Report
        </button>
      </div>

      {/* Saved Reports */}
      {savedReports.length > 0 && (
      <div className="bg-white rounded-lg shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Saved Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedReports.map((report) => (
              <div key={report.id} className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-neutral-dark">{report.name}</h3>
                  <button className="text-neutral-400 hover:text-neutral-600">
                    ⋮
                  </button>
                </div>
                <p className="text-sm text-neutral-500 mb-3">{report.description}</p>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary text-sm flex-1">Run</button>
                  <button className="btn-secondary text-sm">Edit</button>
                  <button className="btn-secondary text-sm">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report Builder */}
      {showBuilder && (
        <ReportBuilder
          dataSource={dataSource}
          setDataSource={setDataSource}
          selectedMetrics={selectedMetrics}
          setSelectedMetrics={setSelectedMetrics}
          filters={filters}
          setFilters={setFilters}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          chartType={chartType}
          setChartType={setChartType}
          onClose={() => setShowBuilder(false)}
          onSave={(report) => {
            setSavedReports([...savedReports, report])
            setShowBuilder(false)
          }}
        />
      )}

      {!showBuilder && savedReports.length === 0 && (
        <div className="bg-white rounded-lg shadow-card p-12 text-center">
          <BarChart3 className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 mb-4">No saved reports yet</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="btn-primary"
          >
            Create Your First Report
          </button>
        </div>
      )}
    </div>
  )
}

interface ReportBuilderProps {
  dataSource: string
  setDataSource: (value: string) => void
  selectedMetrics: string[]
  setSelectedMetrics: (value: string[]) => void
  filters: any[]
  setFilters: (value: any[]) => void
  groupBy: string
  setGroupBy: (value: string) => void
  chartType: 'table' | 'bar' | 'line' | 'pie' | 'heatmap'
  setChartType: (value: 'table' | 'bar' | 'line' | 'pie' | 'heatmap') => void
  onClose: () => void
  onSave: (report: any) => void
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({
  dataSource,
  setDataSource,
  selectedMetrics,
  setSelectedMetrics,
  filters,
  setFilters,
  groupBy,
  setGroupBy,
  chartType,
  setChartType,
  onClose,
  onSave,
}) => {
  const [reportName, setReportName] = useState('')
  const [reportDescription, setReportDescription] = useState('')

  const dataSourceOptions = [
    { value: 'users', label: 'Users' },
    { value: 'sessions', label: 'Sessions' },
    { value: 'cravings', label: 'Cravings' },
    { value: 'journal_entries', label: 'Journal Entries' },
    { value: 'achievements', label: 'Achievements' },
  ]

  const metricOptions = {
    users: ['Count', 'Average Age', 'Registration Trend', 'Active Users'],
    sessions: ['Count', 'Completion Rate', 'Average Time', 'Drop-off Points'],
    cravings: ['Count', 'Intensity Distribution', 'Trigger Breakdown', 'Slip Rate'],
    journal_entries: ['Count', 'Mood Distribution', 'Entries per User', 'Frequency'],
    achievements: ['Total Unlocks', 'Unlock Rate', 'Most Popular', 'Average Days to Unlock'],
  }

  const handleSave = () => {
    if (!reportName.trim()) {
      alert('Report name is required')
      return
    }
    onSave({
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      dataSource,
      metrics: selectedMetrics,
      filters,
      groupBy,
      chartType,
      created_by: 'Current Admin',
      created: new Date().toISOString(),
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Report Builder</h2>
        <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
          ✕
        </button>
      </div>

      {/* Step 1: Data Source */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Step 1: Select Data Source
        </label>
        <select
          value={dataSource}
          onChange={(e) => {
            setDataSource(e.target.value)
            setSelectedMetrics([])
          }}
          className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {dataSourceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2: Choose Metrics */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Step 2: Choose Metrics
        </label>
        <div className="space-y-2">
          {(metricOptions[dataSource as keyof typeof metricOptions] || []).map((metric) => (
            <label key={metric} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedMetrics.includes(metric)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedMetrics([...selectedMetrics, metric])
                  } else {
                    setSelectedMetrics(selectedMetrics.filter(m => m !== metric))
                  }
                }}
                className="rounded border-neutral-300"
              />
              <span className="text-sm text-neutral-700">{metric}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Step 3: Filters */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Step 3: Apply Filters (Optional)
        </label>
        <button
          onClick={() => setFilters([...filters, { field: '', operator: 'equals', value: '' }])}
          className="btn-secondary text-sm"
        >
          + Add Filter
        </button>
        {filters.map((filter, idx) => (
          <div key={idx} className="flex items-center gap-2 mt-2">
            <input
              type="text"
              placeholder="Field"
              value={filter.field}
              onChange={(e) => {
                const newFilters = [...filters]
                newFilters[idx].field = e.target.value
                setFilters(newFilters)
              }}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <select
              value={filter.operator}
              onChange={(e) => {
                const newFilters = [...filters]
                newFilters[idx].operator = e.target.value
                setFilters(newFilters)
              }}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              <option value="equals">Equals</option>
              <option value="greater_than">Greater Than</option>
              <option value="less_than">Less Than</option>
              <option value="contains">Contains</option>
            </select>
            <input
              type="text"
              placeholder="Value"
              value={filter.value}
              onChange={(e) => {
                const newFilters = [...filters]
                newFilters[idx].value = e.target.value
                setFilters(newFilters)
              }}
              className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            />
            <button
              onClick={() => setFilters(filters.filter((_, i) => i !== idx))}
              className="text-danger"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Step 4: Group By */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Step 4: Group By (Optional)
        </label>
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value)}
          className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">None</option>
          <option value="date">Date (Day/Week/Month)</option>
          <option value="language">Language</option>
          <option value="status">Status</option>
        </select>
      </div>

      {/* Step 5: Visualization */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Step 5: Visualization Type
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[
            { value: 'table', icon: Table, label: 'Table' },
            { value: 'bar', icon: BarChart3, label: 'Bar' },
            { value: 'line', icon: TrendingUp, label: 'Line' },
            { value: 'pie', icon: PieChartIcon, label: 'Pie' },
            { value: 'heatmap', icon: FileText, label: 'Heatmap' },
          ].map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                onClick={() => setChartType(type.value as any)}
                className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  chartType === type.value
                    ? 'border-primary bg-primary/10'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs">{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Step 6: Save & Export */}
      <div className="border-t border-neutral-200 pt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">
            Report Name <span className="text-danger">*</span>
          </label>
          <input
            type="text"
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Monthly User Growth Report"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
          <textarea
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Brief description of this report..."
          />
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Now
          </button>
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Report
          </button>
        </div>
      </div>
    </div>
  )
}
