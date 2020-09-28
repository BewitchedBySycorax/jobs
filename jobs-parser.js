const { bold }				= require('cli-color')
const path 						= require('path')
const express 				= require('express')
const consolidate 		= require('consolidate')
const { promisify } 	= require('util')
const request 				= require('request')
const cheerio 				= require('cheerio')

const promisifiedRequest = promisify(request)

const PORT = process.env.PORT || 8000

const app = express()

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))

app.engine('hbs', consolidate.handlebars)
app.set('view engine', 'hbs')
app.set('views', path.resolve(__dirname, 'views'))

const url_storage = new Map([
  ['hh', 'https://hh.ru/search/vacancy?area=null&text=null'],
  ['hc', 'https://career.habr.com/vacancies?city_id=null&q=null']
])

app.get('/', (_, res) => res.redirect('/jobs'))
app.get('/jobs', (_, res) => res.render('jobs', { title: 'Поиск работы' }))

app.post('/jobs', async (req, res) => {

	const { source, city, technology, amount } = req.body
	let city_id = null

	try {
		if (source == 'hh' && url_storage.has('hh')) {
			switch (city) {
				case 'moscow':
					city_id = 1
					break
				case 'petersburg':
					city_id = 2
					break
				default:
					console.log(bold.red('Добавьте интересующий Вас город сюда и во "views/jobs.hbs"'))
					res.render('jobs', {
						no_city: 'Добавьте интересующий Вас город сюда и в "./server.js"'
					})
			}

			const url = url_storage.get('hh')
				.replace(/null/, `${city_id}`)
				.replace(/null/, `${req.body.technology}`)

			const { body } = await promisifiedRequest(url)
			const $ = cheerio.load(body)

			const vacancies = [].slice.call($('.vacancy-serp-item')
				.map((_, element) => 
					`${$(element).find('.vacancy-serp-item__row_header').text()}
					${$(element).find('.vacancy-serp-item__meta-info').text()}`
				), 0, amount)

			res.render('jobs', {
				jobs: vacancies,
			})

		} else if (source == 'hc' && url_storage.has('hc')) {
			switch (city) {
				case 'moscow':
					city_id = 678
					break
				case 'petersburg':
					city_id = 679
					break
				default:
					console.log(bold.red('Добавьте интересующий Вас город сюда и во "views/jobs.hbs"'))
					res.render('jobs', {
						no_city: 'Добавьте интересующий Вас город сюда и в "./server.js"'
					})
			}

			const url = url_storage.get('hc')
				.replace(/null/, `${city_id}`)
				.replace(/null/, `${technology}`)

			const { body } = await promisifiedRequest(url)
			const $ = cheerio.load(body)

			const vacancies = [].slice.call($('.vacancy-card__inner')
				.map((_, element) => 
					`${$(element).find('.vacancy-card__date').text()}
					${$(element).find('.vacancy-card__title').text()}
					${$(element).find('.vacancy-card__salary').text()}`
				), 0, amount)

			res.render('jobs', {
				jobs: vacancies,
			})

		} else {
			res.render('jobs', {
				err: 'Такого источника не существует!',
			})	
		}
	}
	catch(err) {
		throw Error
	}
})

app.listen(PORT, () => {
  console.log(bold.underline.xterm(226)(`Server has been started on localhost: ${PORT}`))
})
