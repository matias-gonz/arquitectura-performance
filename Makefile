build:
	docker build . -t arquitectura_performance

run:
	docker run --rm -p 3000:3000 arquitectura_performance
