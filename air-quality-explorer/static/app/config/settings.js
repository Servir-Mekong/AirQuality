angular.module('baseApp').constant('appSettings', {
	applicationName: 'Mekong Air Quality Explorer',
	footerLinks: [
		{
			'name': 'About',
			'url': 'https://servir.adpc.net/about/about-servir-mekong',
			'show': true
		},
		{
			'name': 'Tools',
			'url': 'https://servir.adpc.net/tools',
			'show': true
		},
		{
			'name': 'Geospatial Datasets',
			'url': 'https://servir.adpc.net/geospatial-datasets',
			'show': true
		},
		{
			'name': 'Resources and Publications',
			'url': 'https://servir.adpc.net/publications',
			'show': true
		},
		{
			'name': 'News',
			'url': 'https://servir.adpc.net/news',
			'show': true
		},
		{
			'name': 'Events',
			'url': 'https://servir.adpc.net/events',
			'show': true
		},
		{
			'name': 'Contact Us',
			'url': 'https://servir.adpc.net/about/contact-servir-mekong',
			'show': true
		},
		{
			'name': 'Privacy Policy',
			'url': '/privacy-policy/',
			'show': true
		}
	],
	partnersHeader: [
		{
			'alt': 'The United States Agency for International Development',
			'url': 'https://www.usaid.gov/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/USAID_Logo_Color.png',
			'src': 'images/usaid.png',
			'className': 'usaid'
		},
		{
			'alt': 'The National Aeronautics and Space Administration',
			'url': 'https://www.nasa.gov/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/NASA_Logo_Color.png',
			'src': 'images/nasa.png',
			'className': 'nasa'
		},
		{
			'alt': 'Asian Disaster Preparedness Center',
			'url': 'http://www.adpc.net/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-adbc.png',
			'src': 'images/adpc.png',
			'className': 'adpc'
		},
		{
			'alt': 'Pollution Control Department',
			'url': 'http://www.pcd.go.th/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-adbc.png',
			'src': 'images/pcd.png',
			'className': 'pcd'
		},
		{
			'alt': 'Geo-Informatics and Space Technology Development Agency',
			'url': 'https://www.gistda.or.th/main/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-adbc.png',
			'src': 'images/gistda.png',
			'className': 'gistda'
		},
		{
			'alt': 'SERVIR',
			'url': 'https://servir.adpc.net/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/Servir_Logo_Color.png',
			'src': 'images/servir-mekong.png',
			'className': 'servir'
		}
	],
	partnersFooter : [
		{
			'alt': 'Spatial Infomatics Group',
			'url': 'https://sig-gis.com/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-sig.png',
			'src': 'images/sig.png',
			'className': 'partner-sig'
		},
		{
			'alt': 'Stockholm Environment Institute',
			'url': 'https://www.sei-international.org/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-sei.png',
			'src': 'images/sei.png',
			'className': 'partner-sei'
		},
		{
			'alt': 'Deltares',
			'url': 'https://www.deltares.nl/en/',
			//'src': 'https://servir.adpc.net/themes/svmk/images/optimized/partner-deltares.png',
			'src': 'images/deltares.png',
			'className': 'partner-deltares'
		}
	],
	parametersSelectors: [{
            'value': 'country',
            'name': 'Country Level'
        },
        {
            'value': 'province',
            'name': 'Administrative Level'
        }
    ],
	stylesSelectors: [{
            'value': 'rainbow',
            'name': 'Rainbow'
        },
        {
            'value': 'tmp_2maboveground',
            'name': 'TMP 1'
        },
        {
            'value': 'dpt_2maboveground',
            'name': 'TMP 2'
        },
        {
            'value': 'sst_36',
            'name': 'SST-36'
        },
        {
            'value': 'greyscale',
            'name': 'Greyscale'
        },
        {
            'value': 'occam',
            'name': 'OCCAM'
        },
        {
            'value': 'occam_pastel-30',
            'name': 'OCCAM Pastel'
        },
        {
            'value': 'redblue',
            'name': 'Red-Blue'
        },
        {
            'value': 'ncview',
            'name': 'NetCDF Viewer'
        },
        {
            'value': 'alg',
            'name': 'ALG'
        },
        {
            'value': 'alg2',
            'name': 'ALG 2'
        },
        {
            'value': 'ferret',
            'name': 'Ferret'
        },
        {
            'value': 'enspmm-refc',
            'name': 'Reflectivity'
        },
        {
            'value': 'browse',
            'name': 'Browse Color Scale'
        }
    ],
	months : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
});
