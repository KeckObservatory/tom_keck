import { useEffect, useMemo, useState } from 'react'
import { CssBaseline, Grid, Paper, Skeleton, styled, ThemeProvider } from '@mui/material'
import { handleTheme } from './theme'
import { TopBar } from './top_bar'
import { TooForm } from './too_form'
import dayjs from 'dayjs'
import { SchedulePanel, type ScheduleItem } from './schedule_panel'
import { TargetForm } from './target_form'
import { keckURL } from './config'

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
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [userinfo, setUserInfo] = useState<UserInfo | null>(null)
  const now = dayjs()
  console.log('Current time:', now.format('YYYY-MM-DD HH:mm:ss'))
  const [date, setDate] = useState<dayjs.Dayjs>(now)

  const semester = useMemo(() => get_semester(date), [date])

  const darkMode = false // This can be replaced with a state or prop to toggle dark mode


  useEffect(() => {
    const handleUserinfo = async () => {
      const resp = await fetch(`${keckURL}userinfo/`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      // Handle token verification failure
      if (!resp.ok) {
        console.error('userinfo fetch failed:', resp.statusText)
        return
      }
      setUserInfo && setUserInfo(await resp.json())
      console.log('Userinfo fetched successfully.')
    }
    handleUserinfo()
  }, [])

  const theme = useMemo(() => {
    const newTheme = handleTheme(darkMode)
    console.log('Theme:', newTheme)
    return newTheme
  }, [darkMode])

  return (
    <div className="App" style={{
      "margin": "0 auto",
      "padding": "2rem",
      "textAlign": "center",
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar userinfo={userinfo} />
        {userinfo ? (
          <>
            <Grid container spacing={12} justifyContent="center">
              <Grid size={4} justifyContent='center'>
                <TooForm obsid={String(userinfo.Id)} schedule={schedule} semester={semester} date={date} setDate={setDate} userinfo={userinfo} />
              </Grid>
              <Grid size={7} justifyContent='center'>
                <SchedulePanel date={date} setDate={setDate} setSchedule={setSchedule} />
                <TargetForm userinfo={userinfo} />
              </Grid>

            </Grid>
          </>
        ) : (
          <Skeleton variant="rectangular" width={"100%"} height={118} />
        )}
          {/* <LoginPanel setUserInfo={setUserInfo} /> */}
      </ThemeProvider>
    </div>
  )
}

export default App
