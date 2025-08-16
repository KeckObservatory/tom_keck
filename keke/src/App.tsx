import { useEffect, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { handleTheme } from './theme'
import { TopBar } from './top_bar'
import { TooForm } from './too_form'
import dayjs from 'dayjs'
import { SchedulePanel } from './schedule_panel'


function App() {
  const [_, setObservations] = useState([])
  const [selectedObservation, setSelectedObservation] = useState<any>({})
  const [target, setTarget] = useState([])
  const now = dayjs()
  console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'))
  const [date, setDate] = useState<dayjs.Dayjs>(now)

  const darkMode = false // This can be replaced with a state or prop to toggle dark mode

  const theme = useMemo(() => {
    const newTheme = handleTheme(darkMode)
    console.log('Theme:', newTheme)
    return newTheme
  }, [darkMode])


  useMemo(() => {

    const fetchTarget = async () => {
      console.log('Fetching target for selected observation:', selectedObservation)
      try {
        const targId = selectedObservation.target
        if (!targId) {
          console.warn('No target ID found in selected observation')
          return
        }
        const response = await fetch(`/api/targets/${targId}?format=json`)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const tgt = await response.json()
        console.log('Target fetched:', tgt)
        setTarget(tgt)
      } catch (error) {
        console.error('Failed to fetch targets:', error)
      }
    }
    fetchTarget()
  }, [selectedObservation])

  useEffect(() => {
    console.log('Fetching observations...')

    const fetchObsResp = async () => {
      try {
        const response = await fetch('/api/observations')
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = await response.json()
        setObservations(data.results)
        if (data.results.length > 0) {
          setSelectedObservation(data.results[0])
        }
      } catch (error) {
        console.error('Failed to fetch observations:', error)
      }

    }

    fetchObsResp()

  }, [])

  return (
    <div className="App" style={{
      "margin": "0 auto",
      "padding": "2rem",
      "textAlign": "center",
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar />
        <SchedulePanel date={date} setDate={setDate} />
        <TooForm target={target} />
      </ThemeProvider>
    </div>
  )
}

export default App
