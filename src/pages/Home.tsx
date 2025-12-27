import { Helmet } from 'react-helmet-async';
import { Box } from '@mui/material';

import { APP_TITLE, PAGE_TITLE_HOME } from '../utils/constants';
import { MapComponent } from '../components/Map';
import { BottomToolbar } from '../components/BottomToolbar';

export const Home = () => {
	return (
		<>
			<Helmet>
				<title>
					{PAGE_TITLE_HOME} | {APP_TITLE}
				</title>
			</Helmet>
			<Box
				sx={{
					position: 'fixed',
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					overflow: 'hidden',
				}}>
				<MapComponent center={[-98.5795, 39.8283]} zoom={4} />
				<BottomToolbar />
			</Box>
		</>
	);
};
