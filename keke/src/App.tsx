import { useEffect, useMemo, useState } from 'react'
import { CssBaseline, Paper, styled, ThemeProvider } from '@mui/material'
import { handleTheme } from './theme'
import { TopBar } from './top_bar'
import { TooForm } from './too_form'
import dayjs from 'dayjs'
import { SchedulePanel } from './schedule_panel'
import { LoginPanel } from './login_panel'
import { TargetForm } from './target_form'
import { tomAPI } from './config'

export interface Target {
  name: string;
  ra: string;
  dec: string;
  epoch: string;
}

export interface UserInfo {
  status: string;
  Id: number;
  Title: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Email: string;
  Affiliation: string;
  WorkArea: string;
  Interests: string;
  Street: string;
  City: string;
  State: string;
  Country: string;
  Zip: string;
  Phone: string;
  Fax: string;
  URL: string;
  ModDate: string;
  Exposed: string;
  username: string;
  resetcode: number;
  AllocInst: string;
  BadEmail: string;
  Category: string;
}

const get_semester = (date: dayjs.Dayjs) => {
  const year = date.year();
  const month = date.month() + 1; // month is 0-indexed in dayjs
  if (month >= 2 && month <= 7) {
    return `${year}A`;
  } else if (month >= 7 && month <= 12) {
    return `${year}B`;
  }
  return '';
}

export const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'sx'
})(
  {
    elevation: 3,
    padding: '12px',
    margin: '6px',
  });

function App() {
  const [_, setObservations] = useState([])
  const [selectedObservation, setSelectedObservation] = useState<any>({})
  const [target, setTarget] = useState([])
  const [userinfo, setUserInfo] = useState<UserInfo | null>(null)
  const now = dayjs()
  console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'))
  const [date, setDate] = useState<dayjs.Dayjs>(now)

  const semester = useMemo(() => get_semester(date), [date])

  const darkMode = false // This can be replaced with a state or prop to toggle dark mode

  const theme = useMemo(() => {
    const newTheme = handleTheme(darkMode)
    console.log('Theme:', newTheme)
    return newTheme
  }, [darkMode])



  useEffect(() => {
    const fetchTarget = async () => {
      console.log('Fetching target for selected observation:', selectedObservation)
      try {
        const targId = selectedObservation.target
        if (!targId) {
          console.warn('No target ID found in selected observation')
          return
        }
        const response = await fetch(`${tomAPI}/targets/${targId}?format=json`)
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
        const response = await fetch(`${tomAPI}/observations/`)
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

  }, [userinfo])

  return (
    <div className="App" style={{
      "margin": "0 auto",
      "padding": "2rem",
      "textAlign": "center",
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar />
        {userinfo ? (
          <>
            <SchedulePanel date={date} setDate={setDate} />
            <TooForm obsid={String(userinfo.Id)} semester={semester}/>
            <TargetForm target={target}/>
          </>
        ) : (
          <LoginPanel setUserInfo={setUserInfo} />
        )}
      </ThemeProvider>
    </div>
  )
}

export default App
