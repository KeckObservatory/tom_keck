import Stack from "@mui/material/Stack";
import { StyledPaper, type UserInfo } from "./App";
import { Box, Button, Tooltip, Typography } from "@mui/material";
import { keckAPIURL } from "./config";

interface Props {
    userinfo?: UserInfo;
}

interface PlanningToolTarget {
    target_name: string;
    ra_deg?: number;
    dec_deg?: number;
    epoch?: number;
    equinox?: number;
    comment?: string;
    pm_ra?: number;
    pm_dec?: number;
    obsid?: number;
    _id?: string;
}

export interface TomTarget {
    id: number;
    targetextra_set: any[];
    aliases: any[];
    name: string;
    type: string;
    created: string;
    modified: string;
    permissions: string;
    ra: number; // Right Ascension in degrees
    dec: number; // Declination in degrees
    epoch: number; // Epoch in years
    parallax: number | null; // Parallax in arcseconds, nullable
    pm_ra: number | null; // Proper motion in RA (mas/yr), nullable
    pm_dec: number | null; // Proper motion in Dec (mas/yr), nullable
    galactic_lng: number | null; // Galactic longitude in degrees, nullable
    galactic_lat: number | null; // Galactic latitude in degrees, nullable
    distance: number | null; // Distance in parsecs, nullable
    distance_err: number | null; // Distance error in parsecs, nullable
    comments: string | null; // Comments, nullable
    scheme: string | null; // Scheme, nullable
    epoch_of_elements: number | null; // Epoch of elements, nullable
    mean_anomaly: number | null; // Mean anomaly, nullable
    arg_of_perihelion: number | null; // Argument of perihelion, nullable
    eccentricity: number | null; // Eccentricity, nullable
    lng_asc_node: number | null; // Longitude of ascending node, nullable
    inclination: number | null; // Inclination, nullable
    mean_daily_motion: number | null; // Mean daily motion, nullable
    semimajor_axis: number | null; // Semimajor axis, nullable
    epoch_of_perihelion: number | null; // Epoch of perihelion, nullable
    ephemeris_period: number | null; // Ephemeris period, nullable
    ephemeris_period_err: number | null; // Ephemeris period error, nullable
    ephemeris_epoch: number | null; // Ephemeris epoch, nullable
    ephemeris_epoch_err: number | null; // Ephemeris epoch error, nullable
    perihdist: number | null; // Perihelion distance, nullable
    groups: string[]; // Groups, non-nullable
}

const tom_target_to_planning_tool_target = (target: TomTarget, obsid: string): PlanningToolTarget => {
    let tgt = {
        target_name: target.name,
        ra_deg: target.ra,
        dec_deg: target.dec,
        equinox: target.epoch,
        comment: target.comments || undefined,
        pm_ra: target.pm_ra || undefined,
        pm_dec: target.pm_dec || undefined,
        obsid: Number(obsid),
    }

    return tgt;
}

export const TargetForm = (props: Props) => {
    const { userinfo } = props;

    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)

    const name = urlParams.get('name') || 'No Target Name';
    const ra = urlParams.get('ra') || 0;
    const dec = urlParams.get('dec') || 0;
    const epoch = urlParams.get('epoch') || 2000;
    const parallax = urlParams.get('parallax') ? parseFloat(urlParams.get('parallax') || '0') : undefined;
    const pm_ra = urlParams.get('pm_ra') ? parseFloat(urlParams.get('pm_ra') || '0') : undefined;
    const pm_dec = urlParams.get('pm_dec') ? parseFloat(urlParams.get('pm_dec') || '0') : undefined;

    const target = {
        name,
        ra,
        dec,
        epoch,
        parallax,
        pm_ra,
        pm_dec
    }



    const handle_send_to_planning_tool = async () => {

        try {
            if (userinfo) {
                const mytgt = { ...target };
                const planningToolTarget = tom_target_to_planning_tool_target(mytgt as unknown as TomTarget, String(userinfo.Id));
                const body = {'targets': [planningToolTarget]};
                document.cookie = `observer=thisisfromtom=?obsid=${btoa(userinfo.Id.toString())}; domain=www3.keck.hawaii.edu; path=/;`;
                const response = await fetch(`${keckAPIURL}planning_tool/submitPlanningToolTarget`, {
                    //credentials: "same-origin",
                    credentials: "include",
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                });

                if (!response.ok) {
                    throw new Error(`Error sending target to Planning Tool: ${response.statusText}`);
                }
                const data = await response.json();
                console.log('Target sent to Planning Tool successfully:', data);
            }
        } catch (error) {
            console.error('Failed to send target to Planning Tool:', error);
        }
    }

    return (
        <Stack sx={{
            paddingTop: '16px',
            display: 'flex',
            flexWrap: 'wrap',
        }}
            justifyContent='center'
            maxWidth='100%'
        >
            <StyledPaper
            >
                <Box>
                    <Stack sx={{ marginBottom: '24px' }} width="100%" direction="row" justifyContent='center' spacing={2}>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`Target name: ${target?.name || 'No target selected'}`}
                        </Typography>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`RA: ${target?.ra}`}
                        </Typography>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`Dec: ${target?.dec}`}
                        </Typography>
                        <Typography variant="h6" sx={{ alignSelf: 'center' }}>
                            {`Epoch: ${target?.epoch}`}
                        </Typography>
                    </Stack>
                    <Tooltip title={'Visualize target using Keck\'s Planning Tool'}>
                        <Button
                            variant="contained"
                            onClick={handle_send_to_planning_tool}
                        >
                            Send Target to Planning Tool
                        </Button>
                    </Tooltip>
                </Box>
            </StyledPaper>
        </Stack >
    )
}