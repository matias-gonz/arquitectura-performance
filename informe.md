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
Este escenario, en la mayoría de casos se utilizó como Load testing, es decir  que la cantidad de carga que se envia lo puede soportar la API.

### Escenario 2

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 8 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 8 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 8 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.
Este escenario, para el endpoint de _space_news_ se utilizó como Load testing, es decir  que la cantidad de carga que se envia lo puede soportar la API.

### Escenario 3

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 15 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 15 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 15 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.
Este escenario, para el endpoint de _space_news_ se utilizó como Stress testing, es decir que la cantidad de carga que se envia no puede ser soportada del todo por la API.

### Escenario 4

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 500 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 500 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 500 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.
Este escenario, para la mayoría de casos se utilizó como Stress testing, es decir que la cantidad de carga que se envia no puede ser soportada del todo por la API.

## Tácticas

### Táctica 1 - Caso Base

Como primer acercamiento, tendremos la configuración básica para que el proyecto funcione con un solo nodo en nginx. El servicio se conecta a las APIs externas por cada request.

* **_Gráfico de arquitectura_**

* **_Gráfico escenario 1 realizando request a /ping_**
![](https://hackmd.io/_uploads/Hy4WkCQ43.png)
![](https://hackmd.io/_uploads/S1JfkAQVn.png)

*Conclusión:* A primera vista, se puede observar la fase de *Ramp* en donde la cantidad de requests aumenta de 5 a 40 requests por segundo. Después de esa curva ascendente podemos apreciar la fase *Plain* en donde la cantidad de requests se mantiene constante y seguido podemos apreciar la fase *Ramp down* en donde vemos la caída de las requests. Por último, vemos la fase *Stop* en la que se realiza es una limpieza a las métricas. 
Además, siendo el endpoint más simple de todos, se puede observar como el consumo de CPU llega a un máximo de 9.24% y en promedio 4.57%. De la misma manera, se observa que todas las requests fueron correctas, llegando a un máximo de 400 requests en total, y el tiempo de respuesta no supera los 42.4 ms. Este tiempo de respuesta corresponde al tiempo de todo el flujo incluyendo Nginx. 

![](https://hackmd.io/_uploads/H1IsAT7N3.png)
*Conclusión:* El gráfico anterior muestra el tiempo promedio de respuesta del servidor, en el cual se puede observar que oscila aproximadamente en 0.4ms. Está es la única métrica de tiempo de respuesta que podemos obtener ya que ping no interactúa con ninguna API externa.

* **_Gráfico escenario 2 realizando request a /space_news_**
![](https://hackmd.io/_uploads/Hk22g07N3.png)
![](https://hackmd.io/_uploads/rJYalAQ42.png)

*Conclusión:* Además de verse claramente las 4 fases, se puede observar que el uso de CPU máximo en este escenario aumenta a un 9.76%, y el promedio a 5.20%. Esto se debe al procesamiento extra que posee este endpoint. 
Por otro lado, podemos ver que el tiempo máximo de respuesta fue de 6.06s con un promedio de 2.29s.
A su vez, como se observará en el siguiente escenario, se debe tener en cuenta que la cantidad máxima de requests por segundo fue de 8, lograndose que todas devuelvan una respuesta correcta.

![](https://hackmd.io/_uploads/HyhFgRmV3.png)
*Conclusión:* Este gráfico también muestra el tiempo promedio de respuesta del servidor, en el cual se puede notar que a medida que se acumulan las requests, el tiempo promedio de respuesta aumenta. Por otro lado, ya que nuestra API no tiene un procesamiento complejo una vez recibida la respuesta de la API externa, los tiempos de respuesta entre ambos son prácticamente iguales y por lo tanto en el gráfico no se puede percibir una diferencia y se pisan.


* **_Gráfico escenario 3 realizando request a /space_news_**
![](https://hackmd.io/_uploads/ByKZ7074h.png)
![](https://hackmd.io/_uploads/SkQz7RX43.png)

*Conclusión:* Ya que nos encontramos en el caso base, donde no está integrado Redis, se puede observar cómo la cantidad de requests sobrepasa a la API de space news, generando una response con status 502, y por lo tanto un timeout al llegar aproximadamente a 10 requests por segundo. Por otro lado, el consumo máximo de la CPU llega a un 19.1%.


![](https://hackmd.io/_uploads/rkwmfRQN2.png)
*Conclusión:* Este gráfico muestra el tiempo promedio de respuesta del servidor del escenario 3. Se puede observar que al requerir mas tiempo de procesamiento este tiempo empieza en 1000ms, el cual ya es un número elevado comparado con el resto de los escenarios, y escala hasta llegar a un tiempo promedio de respusta de aproximadamente 17.500ms. También se puede ver que se estabiliza entre 15K ms y 17,5k ms. Teniendo en cuenta que debido a la cantidad de requests acumuladas la API externa devuelve valores no soportados por nuestra API resultando en error, por eso el gráfico se corta abruptamente en vez de ir disminuyendo como en el resto de los casos. 
* **_Gráfico escenario 1 realizando request a /fact_**
![](https://hackmd.io/_uploads/S174UAmVh.png)
![](https://hackmd.io/_uploads/S1lSIRQVn.png)

*Conclusión:* A diferencia del endpoint /space_news, si bien realiza requests a una API externa, con un máximo de 40 requests por segundo, en ningún momento deja de responder con solicitudes correctas. En este caso, se puede observar un uso máximo de CPU de 32.3%, con un tiempo de respuesta máximo de 961ms.

![](https://hackmd.io/_uploads/S1D9BCmNn.png)
*Conclusión:* En este gráfico que muestra el tiempo promedio de respuesta del servidor sí podemos observar una diferencia entre el tiempo de nuestra API y el tiempo de la API externa. Esto se debe a que nuestra API tiene un pequeño procesamiento extra que hace el tiempo se eleve un poco más, diferenciándose del tiempo promedio de respuesta de la API externa _/fact_

* **_Gráfico escenario 1 realizando request a /metar_**

Estaciones: SAEZ(Ezeiza), KJFK(New York), LIRU(Rome), RJTT(Tokyo)
![](https://hackmd.io/_uploads/S1DL907Nh.png)
![](https://hackmd.io/_uploads/BkZwqC7V2.png)

*Conclusión:* De la misma manera, se puede observar que en ningún momento deja de responder con solicitudes correctas. En este caso, se puede observar un uso máximo de CPU de 31.0%, ya que requiere todo el post-procesamiento de la respuesta de _aviationweather_, pero a su vez, curiosamente el tiempo de respuesta máximo es de 236 ms, lo cual en comparación a los anteriores fue poco tiempo.

![](https://hackmd.io/_uploads/BJ-4c0m4h.png)
*Conclusión:* En este gráfico podemos observar notoriamente la diferencia entre el tiempo promedio de respuesta de nuestra API y el tiempo de la API externa _/metar_. Esto se debe a que nuestra API tiene un mayor procesamiento que hace el tiempo se eleve más, diferenciándose bastante del tiempo promedio de respuesta de la API externa _/metar_

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

Estaciones: SAEZ(Ezeiza), KJFK(New York), LIRU(Rome), RJTT(Tokyo)

_Recursos utilizados de la réplica 1_:
![](https://hackmd.io/_uploads/Hy3guEVE3.png)

_Recursos utilizados de la réplica 2_:
![](https://hackmd.io/_uploads/ryuyu4EVn.png)

_Recursos utilizados de la réplica 3_:
![](https://hackmd.io/_uploads/rkiRPVNN3.png)

*Conclusión:* Se puede observar cómo disminuyó el consumo de CPU a un máximo de un 13.1% entre las 3 réplicas, con un porcentaje de consumo (en total) similar a la táctica anterior.

* **_Gráfico escenario 4 realizando request a /ping_**
![](https://hackmd.io/_uploads/S1fauSNEn.png)
![](https://hackmd.io/_uploads/rJ6pOSE4h.png)
(Recursos utilizados de nodo 1)

*Conclusión:* En este escenario se pone a prueba el consumo de CPU, ya que entre los 3 nodos se alcanza prácticamente un 90% de este. Esto se va a ver reflejado en que las requests comienzar a fallar, devolviendo un `CONNECTION RESET` y `TIMEOUT`, como se observa en el gráfico superior. También, se puede observarque el tiempo de respuesta aumenta hasta un máximo de 10 segundos.

![](https://hackmd.io/_uploads/Sy6Nwr4E3.png)

*Conclusión:* Si bien, el tiempo de respuesta del servicio alcanza los 10 segundos, se puede observar que el tiempo interno que demora la API (sin intermediarios, como nginx) no alcanza un segundo.

* **_Gráfico escenario 4 realizando request a /fact_**
![](https://hackmd.io/_uploads/rJ_sQUVEn.png)
![](https://hackmd.io/_uploads/BkZ6X8ENn.png)

*Conclusión:* 

![](https://hackmd.io/_uploads/rk8fQINN3.png)
*Conclusión:* 


### Táctica 3 - Rate limiting

En esta táctica, lo que se busca es limitar la cantidad de requests que puede recibir nuestro servicio HTTP. Para lograr esto, se utiliza la libreria `express-rate-limit`, de la cual se muestra a continuación un ejemplo de implementación:

```
const limiter = rateLimit({
	windowMs: 50 * 1000, // 50 seconds
	max: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})
app.use(limiter);
```

En este ejemplo se busca limitar a un máximo de 1000 requests en un lapso de 50 segundos. A partir de entonces, las requests recibidas serán rechazadas con un status code 429 (Too Many Requests). Luego de un lapso de 30 segundos, volverá a repetir el tamaño de la ventana.

* **_Gráfico de arquitectura_**

* **_Gráfico escenario 1 realizando request a /ping_**
![](https://i.imgur.com/377mStI.png)
![](https://i.imgur.com/OX5vXhj.png)

*Conclusión:* En este escenario, se plantea un limite de 1000 requests en un lapso de 50 segundos. Lo que se puede observar en los gráficos es que todas las requests tienen una respuesta correcta hasta llegar a las 1000. A partir de este momento, se limitan las requests, por lo tanto todan devuelven un 429, y ninguna  es correcta. Finalizada la ventana, se vuelve a reiniciar el limite de requests aceptadas.

* **_Gráfico escenario 3 realizando request a /space_news_**
![](https://i.imgur.com/CzeglmH.png)
![](https://i.imgur.com/xoVltde.png)

*Conclusión:* En este escenario, se plantea un limite de 200 requests en un lapso de 50 segundos. Esto se espera que limite la cantidad de requests que le llegan a la API externa de space_news, evitando que genera timeouts. La razón es que cada request puede llegar a demorar hasta 10 segundos, lo que genera una cola de procesamientos y eventualmente timeouts. Comparandolo a la táctica 1, se puede observar que solamente se devuelven 13 requests con error, al final del escenario. Esto debe suceder ya que, como fue previamente mencionado, se acumuló una cantidad de requests lo suficientemente grande como llegar a ese timout. Por otro lado, se puede observar como al limitar a 200 la cantidad de requests posibles, durante gran parte del procesamiento alcanza a realizar una respuesta correcta a todas las requests; a diferencia de la táctica 1 que se ven muchas requests fallidas desde la fase de _Plain_.

### Táctica 4 - Rate limiting + Nodos replicados

En esta táctica, lo que se busca es limitar la cantidad de requests que puede recibir nuestro servicio HTTP, teniendo en cuenta que se generan 3 réplicas del servidor. A priori, como el limite se aplica a cada nodo replicado, el limite del servidor va a ser 3 veces el límite de requests.

* **_Gráfico escenario 1 realizando request a /ping con limite de 1500 requests_**
![](https://hackmd.io/_uploads/ry8mVbQV3.png)
![](https://hackmd.io/_uploads/rkk4EZm43.png)

*Conclusión:* Realizando un aproximado, la cantidad total de requests que se generan son más 4000. Por lo tanto, al aplicar un limite de 1500 requests, si se aplica por cada nodo, no debería limitar ninguna request. Como se puede observar, esto es lo que sucede.

Por lo tanto, esta táctica sirve para limitar un servidor, pero aumentando los recursos a N réplicas y cada una sigue ofreciendo su límite individual.

* **_Gráfico escenario 1 realizando request a /ping con limite de 1000 requests_**
![](https://hackmd.io/_uploads/rJU-BWQN3.png)
![](https://hackmd.io/_uploads/rkAZBZmN2.png)

*Conclusión:* En este escenario, podemos observar que efectivamente, al tener un limite de 1000 requests por nodo, si se alcanza y por lo tanto si comienza a limitar las requests.

### Táctica 5 - Rate limiting + Nodos replicados + Redis

En esta táctica, la idea es que Redis funcione como un almacenamiento compartido entre las réplicas, por lo tanto el límite no se dé por réplica sino que será el mismo para todo el servidor.

![](https://hackmd.io/_uploads/Sy_K07VVh.png)
![](https://hackmd.io/_uploads/BJ6FRQ4Eh.png)
*Conclusión:* En este escenario, utilizando un límite de 1500 requests por cada 50s, podemos ver que éste se comparte entre los tres nodos por lo que se empiezan a limitar las requests mucho antes. Acá podemos ver una notoria diferencia con la táctica anterior, cuyo límite era de 1500 requests en cada réplica y nunca se llegaba a limitar ninguna.

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
- [x] Replicate repositories - rate limiting
- [x] Rate limiting


**Escenarios**
- [x] Carga con distintos aeropuertos

