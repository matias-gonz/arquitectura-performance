# Trabajo Práctico 1 - Arquitectura de Software (75.73)

## Introduccion

En estre trabajo práctico se comparan diferentes tácticas aplicadas a un servicio HTTP en Node.js-Express que brinda cuatro endpoints los cuales consume tres APIs externas para dar información a sus usuarios.

Las tecnologias utilizadas para implementar el servicio fueron docker, docker-compose, redis y nginx. Las estadísticas y métricas sobre la performance a lo largo del tiempo se midieron utilizando Grafana, Graphite y Artillery. Estas herramientas permiten visualizar el consumo de recursos, response time, entre otras.


El servicio se conecta a las siguientes APIs externas:
* [Spaceflight News](https://spaceflightnewsapi.net/)
* [Useless facts](https://uselessfacts.jsph.pl/)
* [METAR](https://www.aviationweather.gov/adds/dataserver_current)

## Escenarios

### Escenario 1

Descripción

### Escenario 2

Descripción

## Tácticas

### Táctica 1 - Nombre

Como primer acercamiento, tendremos la configuración básica para que el proyecto funcione con un solo nodo en nginx. El servicio se conecta a las APIs externas por cada request.

Gráfico de arquitectura


Gráfico escenario 1

Gráfico escenario 2

Conclusión

### Táctica 2 - Nombre

Descripción

Gráfico escenario 1

Gráfico escenario 2

Conclusión