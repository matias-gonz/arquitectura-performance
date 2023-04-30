# Trabajo Práctico 1 - Arquitectura de Software (75.73)

## Introduccion

En estre trabajo práctico se comparan diferentes tácticas aplicadas a un servicio HTTP en Node.js-Express que brinda cuatro endpoints los cuales consumen tres APIs externas para dar información a sus usuarios.

Las tecnologias utilizadas para implementar el servicio fueron docker, docker-compose, redis y nginx. Las estadísticas y métricas sobre la performance a lo largo del tiempo se midieron utilizando Grafana, Graphite y Artillery. Estas herramientas permiten visualizar el consumo de recursos, response time, entre otras.


El servicio se conecta a las siguientes APIs externas:
* [Spaceflight News](https://spaceflightnewsapi.net/)
* [Useless facts](https://uselessfacts.jsph.pl/)
* [METAR](https://www.aviationweather.gov/adds/dataserver_current)

## Escenarios

### Escenario 1

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 5 requests por segundo aumentando hasta llegar a 40 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 40 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 40 requests por segundo disminuyendo hasta llegar a 5 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.

### Escenario 2

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 8 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 8 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 8 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.

### Escenario 3

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 15 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 15 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 15 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.

## Tácticas

### Táctica 1 - Caso Base

Como primer acercamiento, tendremos la configuración básica para que el proyecto funcione con un solo nodo en nginx. El servicio se conecta a las APIs externas por cada request.

* **_Gráfico de arquitectura_**

* **_Gráfico escenario 1 realizando request a /ping_**
![](https://i.imgur.com/li25y4t.png)
![](https://i.imgur.com/wsKXT8k.png)

*Conclusión:* A primera vista, se puede observar la fase de *Ramp* en donde la cantidad de requests aumenta de 5 a 40 requests por segundo. Después de esa curva ascendente podemos apreciar la fase *Plain* en donde la cantidad de requests se mantiene constante y seguido podemos apreciar la fase *Ramp down* en donde vemos la caída de las requests. Por último, vemos la fase *Stop* en la que se realiza es una limpieza a las métricas. 
Además, siendo el endpoint más simple de todos, se puede observar como el consumo de CPU llega a un máximo de 5.14% y en promedio 2.6%. De la misma manera, se observa que todas las requests fueron correctas, llegando a un máximo de 402 requests en total, y el tiempo de respuesta no supera los 42.5 ms. 

* **_Gráfico escenario 2 realizando request a /space_news_**
![](https://i.imgur.com/bJnqmTx.png)
![](https://i.imgur.com/MxPqtzb.png)

*Conclusión:* Además de verse claramente las 4 fases, se puede observar que el uso de CPU máximo en este escenario aumenta a un 7.7%, y el promedio a 3.57%. Esto se debe al procesamiento extra que posee este endpoint. 
Por otro lado, podemos ver que el tiempo máximo de respuesta fue de 5.79s con un promedio de 1.76s.
A su vez, como se observará en el siguiente escenario, se debe tener en cuenta que la cantidad máxima de requests por segundo fue de 8, lograndose que todas devuelvan una respuesta correcta.

* **_Gráfico escenario 3 realizando request a /space_news_**
![](https://i.imgur.com/kMAUejc.png)
![](https://i.imgur.com/iVX0A3I.png)

*Conclusión:* Ya que nos encontramos en el caso base, donde no está integrado Redis, se puede observar cómo la cantidad de requests sobrepasa a la API de space news, generando una response con status 502, y por lo tanto un timeout al llegar aproximadamente a 10 requests por segundo. Por otro lado, el consumo máximo de la CPU llega a un 19.1%.

* **_Gráfico escenario 1 realizando request a /fact_**
![](https://i.imgur.com/PzvUlFo.png)
![](https://i.imgur.com/xLjqOx7.png)

*Conclusión:* A diferencia del endpoint /space_news, si bien realiza requests a una API externa, con un máximo de 40 requests por segundo, en ningún momento deja de responder con solicitudes correctas. En este caso, se puede observar un uso máximo de CPU de 24.7%, con un tiempo de respuesta máximo de 865 ms.

* **_Gráfico escenario 1 realizando request a /metar_**

Station: BAEZ
![](https://i.imgur.com/GyQkhlm.png)
![](https://i.imgur.com/g2gw1pa.png)

*Conclusión:* De la misma manera, se puede observar que en ningún momento deja de responder con solicitudes correctas. En este caso, se puede observar un uso máximo de CPU de 37.2%, ya que requiere todo el post-procesamiento de la respuesta de _aviationweather_, pero a su vez, curiosamente el tiempo de respuesta máximo es de 295 ms, lo cual en comparación a los anteriores fue poco tiempo.


### Táctica 2 - Nodos replicados

Como segunda táctica utilizamos 3 réplicas del servicio HTTP, donde Nginx representa un balanceador de carga. Esto significa que al realizarse distintas request, se dividen mediante las distintas réplicas, en este caso equitativamente ya que ninguna tiene un peso superior.

Para comprobar que efectivamante hay 3 réplicas, el endpoint de _Ping_ devuelve un número random, y al realizar varias requests, se puede observar que ese valor varía entre 3 números distintos:
```
❯ curl http://localhost:5555/api/ping
[49] pong!
❯ curl http://localhost:5555/api/ping
[69] pong!
❯ curl http://localhost:5555/api/ping
[18] pong!
```

* **_Gráfico de arquitectura_**

* **_Gráfico escenario 1 realizando request a /ping_**
![](https://i.imgur.com/Z5rVKC1.png)
_Recursos utilizados de la réplica 1_:
![](https://i.imgur.com/qyffV8g.png)
_Recursos utilizados de la réplica 2_:
![](https://i.imgur.com/S8fs4Ty.png)
_Recursos utilizados de la réplica 3_:
![](https://i.imgur.com/m2hjNap.png)

*Conclusión:* En comparación con la táctica 1, se observa como el consumo de recursos disminuye a una tercera parte en cada nodo (en promedio 1.8%), ya que el consumo se distribuye a cada uno de los 3 nodos.

* **_Gráfico escenario 3 realizando request a /space_news_**
![](https://i.imgur.com/xxWKieh.png)
_Recursos utilizados de la réplica 1_:
![](https://i.imgur.com/2cljqHz.png)

*Conclusión:* Si bien hay 3 réplicas para distribuir las requests, esto no influye en la API externa por lo que al igual que con la táctica 1, sigue "colapsando" y finalmente se reciben muchas requests con timeout. En cuanto al consumo de CPU, el máximo entre las 3 réplicas es de 7.09%.

* **_Gráfico escenario 1 realizando request a /fact_**

_Recursos utilizados de la réplica 1_:
![](https://i.imgur.com/YaZipZW.png)
_Recursos utilizados de la réplica 2_:
![](https://i.imgur.com/vKW2WXf.png)
_Recursos utilizados de la réplica 3_:
![](https://i.imgur.com/wIMiawL.png)

*Conclusión:* Se puede observar cómo disminuyó el consumo de CPU a un máximo de un 10.7% entre las tres réplicas, y el tiempo de respuesta sigue en 859 ms.

* **_Gráfico escenario 1 realizando request a /metar_**

_Recursos utilizados de la réplica 1_:

_Recursos utilizados de la réplica 2_:
![](https://i.imgur.com/6uXpEi1.png)
_Recursos utilizados de la réplica 3_:
![](https://i.imgur.com/wIMiawL.png)

*Conclusión:* Se puede observar cómo disminuyó el consumo de CPU a un máximo de un 10.7% entre las tres réplicas, y el tiempo de respuesta sigue en 859 ms.



**Tácticas**

- [X] Caso base
- [ ] Cache lazy population
- [ ] Cache active population
- [ ] Cache lazy population - replicated repositories
- [ ] Cache active population - replicated repositories
- [ ] Cache lazy population - rate limiting
- [ ] Cache active population - rate limiting
- [ ] Cache lazy population - replicated repositories - rate limiting
- [ ] Cache active population - replicated repositories - rate limiting
- [x] Replicated repositories
- [ ] Replicate repositories - rate limiting
- [ ] Rate limiting


**Escenarios**
- [ ] Carga con distintos aeropuertos

