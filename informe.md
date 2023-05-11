# Trabajo Práctico 1 - Arquitectura de Software (75.73)

## Introduccion

En este trabajo práctico se comparan diferentes tácticas aplicadas a un servicio HTTP en Node.js-Express que brinda cuatro endpoints, los cuales consumen tres APIs externas para dar información a sus usuarios.

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
Este escenario, se utilizó como Stress testing para el endpoint de _Ping_, es decir que la cantidad de carga que se envia no puede ser soportada del todo por la API.

### Escenario 5

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 240 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 240 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 240 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.
Este escenario, se utilizó como Stress testing para el endpoint de _Fact_, es decir que la cantidad de carga que se envia no puede ser soportada del todo por la API.

### Escenario 6

* **Ramp:** Durante un tiempo de 30 segundos, inicialmente se realizan 2 requests por segundo aumentando hasta llegar a 200 requests por segundo.
* **Plain:** Durante un tiempo de 60 segundos se realizan 200 requests por segundo.
* **Ramp down:** Durante un tiempo de 30 segundos, inicialmente se realizan 200 requests por segundo disminuyendo hasta llegar a 2 requests por segundo.
* **Stop:** Durante un tiempo de 30 segundos, se realiza una sola request por segundo.
Este escenario, se utilizó como Stress testing para el endpoint de _metar_, es decir que la cantidad de carga que se envia no puede ser soportada del todo por la API.


## Tácticas

### Táctica 1 - Caso Base

Como primer acercamiento, tendremos la configuración básica para que el proyecto funcione con un solo nodo en nginx. El servicio se conecta a las APIs externas por cada request.

**_Components and Connectors_**

![](https://hackmd.io/_uploads/Hk_DXIOV2.png)


**_Atributos de calidad_**

**Seguridad:** Nginx beneficia la seguridad del servidor con respecto a tenerlo expuesto directamente a la red.
* Autorización: Nginx puede funcionar como proxy y regular el acceso a los servidores.

**Escalabilidad:** Al tener Nginx es relativamente fácil escalar horizontalmente efectivamente ya que se pueden agregar mas réplicas.


**_Gráficos de los escenarios_**

* **_Escenario 1 realizando request a /ping_**

_Gráficos obtenidos de Cadvisor_:
![](https://hackmd.io/_uploads/ryJzCRq4n.png)
![](https://hackmd.io/_uploads/r18G0C9Vh.png)
![](https://hackmd.io/_uploads/SyzmC0cN2.png)

*Conclusión:* Para el container de node, se puede observar que el consumo de CPU es máximo de 0.15, y el consumo de memoria total es de 150 Mb.


_Gráficos obtenidos de Grafana_:
![](https://hackmd.io/_uploads/BJ5pRA54h.png)
![](https://hackmd.io/_uploads/B1NCA09E3.png)

*Conclusión:* A primera vista, se puede observar la fase de *Ramp* en donde la cantidad de requests aumenta de 5 a 40 requests por segundo. Después de esa curva ascendente podemos apreciar la fase *Plain* en donde la cantidad de requests se mantiene constante y seguido podemos apreciar la fase *Ramp down* en donde vemos la caída de las requests. Por último, vemos la fase *Stop* en la que se realiza es una limpieza a las métricas. 
Además, siendo el endpoint más simple de todos, se puede observar como el consumo de CPU llega a un máximo de 10.1% y en promedio 6.07%. De la misma manera, se observa que todas las requests fueron correctas, llegando a un máximo de 400 requests en total, y el tiempo de respuesta no supera los 51.4 ms. Este tiempo de respuesta corresponde al tiempo de todo el flujo incluyendo Nginx. 

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

* **_Escenario 4 realizando request a /ping_**

En este escenario se busca realizar un stress testing al endpoint de _Ping_

_Gráficos obtenidos de Cadvisor_:
![](https://hackmd.io/_uploads/SypYxysE2.png)
![](https://hackmd.io/_uploads/Hy4qe1sEn.png)
![](https://hackmd.io/_uploads/SkyslJj4n.png)

*Conclusión:* Se puede observar como el container de node llega a un consumo máximo de CPU de 0.7, y el uso de memoria llega a untotal de 175 Mb. 

_Gráficos obtenidos de Grafana_:
![](https://hackmd.io/_uploads/Hkg8EWJj4h.png)
![](https://hackmd.io/_uploads/SJ0EZksVh.png)

*Conclusión:* En este escenario se pone a prueba el consumo de CPU, ya que alcanza un 58% de este. Esto se va a ver reflejado en que las requests comienzar a fallar, devolviendo un `CONNECTION RESET` y `TIMEOUT`, como se observa en el gráfico superior. También, se puede observa que el tiempo de respuesta aumenta hasta un máximo de 8.24 segundos.

* **_Gráfico escenario 5 realizando request a /fact_**
![](https://hackmd.io/_uploads/HyvuVNuV2.png)
![](https://hackmd.io/_uploads/ryetNVdE2.png)

*Conclusión:* Al realizar un máximo de 240 requests por segundo, se puede observar como llega a un punto donde las requests comienzan a fallar. En cuanto al consumo de la CPU, se alcanza un máximo de consumo de 129%, y el tiempo de respuesta máximo es de 10 segundos.

* **_Gráfico escenario 6 realizando request a /metar_**
![](https://hackmd.io/_uploads/Hk5gRVdE2.png)
![](https://hackmd.io/_uploads/rJvbREO42.png)

*Conclusión:* Con un máximo de 200 requests, se puede observar como se alcanza un limite, ya que hay en total 65 requests que fallan debido a un `TIMEOUT`. Al subir esta cantidad, uno puede inferir que la cantidad de requests fallidas aumentaría en gran cantidad. El consumo máximo de CPU es de un 125%, y el tiempo de respuesta máximo es de 10s.

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

**_Components and Connectors_**

![](https://hackmd.io/_uploads/H1ByBUdEn.png)

**_Atributos de calidad_**

**Fiabilidad:** Con nodos replicados evitamos un único punto de fallo: si se cae un servidor, hay otros dos que pueden seguir respondiendo.

**Seguridad:**
* Disponibilidad: Al tener nodos replicados, el sistema es mas robusto y mas fuerte a ataques DoS.

**Escalabilidad:** Se mantiene igual a la táctica 1.

**Performance:**  Se mantiene similar a las tácticas anteriores.


**_Gráficos de los escenarios_**

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

*Conclusión:* En este escenario se pone a prueba el consumo de CPU, al igual que en la táctica 1, ya que entre los 3 nodos se alcanza prácticamente un 90% de este. Se puede observar como las requests comienzar a fallar. También, se puede observar que el tiempo de respuesta aumenta hasta un máximo de 10 segundos.

![](https://hackmd.io/_uploads/Sy6Nwr4E3.png)

*Conclusión:* Si bien, el tiempo de respuesta del servicio alcanza los 10 segundos, se puede observar que el tiempo interno que demora la API (sin intermediarios, como nginx) no alcanza un segundo.


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


**_Components and Connectors_**

_Ver táctica 1_

**_Atributos de calidad_**

**Seguridad:**
* Disponibilidad: Al limitar requests, se evita que el servidor se caiga por exceso de carga.

**Escalabilidad:** Se mantiene igual que las tácticas 1 y 2.

**Fiabilidad:** Con respecto a la táctica 2, la fiabilidad empeora ya que no hay redundancias y el servidor se convierte en un único punto de fallo.

**Performance:**  Se mantiene similar a las tácticas anteriores.


**_Gráficos de los escenarios_**

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

**_Components and Connectors_**

_Ver táctica 2_

**_Atributos de calidad_**

**Seguridad:**
* Disponibilidad: Al limitar requests, se evita que el servidor se caiga por exceso de carga.

**Fiabilidad:** Con respecto a la táctica 3, la fiabilidad mejora porque se evita un único punto de falla.

**Escalabilidad:** Se mantiene igual que las tácticas 1, 2 y 3.

**Performance:**  Se mantiene similar a las tácticas anteriores.

**_Gráficos de los escenarios_**

* **_Gráfico escenario 1 realizando request a /ping con limite de 1500 requests_**
![](https://hackmd.io/_uploads/ry8mVbQV3.png)
![](https://hackmd.io/_uploads/rkk4EZm43.png)

*Conclusión:* Realizando un aproximado, la cantidad total de requests que se generan son más 4000. Por lo tanto, al aplicar un limite de 1500 requests, si se aplica por cada nodo, no debería limitar ninguna request. Como se puede observar, esto es lo que sucede.

Por lo tanto, esta táctica sirve para limitar un servidor, pero aumentando los recursos a N réplicas y cada una sigue ofreciendo su límite individual.

* **_Gráfico escenario 1 realizando request a /ping con limite de 1000 requests_**
![](https://hackmd.io/_uploads/rJU-BWQN3.png)
![](https://hackmd.io/_uploads/rkAZBZmN2.png)

*Conclusión:* En este escenario, podemos observar que efectivamente, al tener un limite de 1000 requests por nodo, si se alcanza y por lo tanto si comienza a limitar las requests.

### Táctica 5 - Cache lazy population

Se agrega un cache para almacenar datos de las APIs externas:
* Space news: Si las ultimas noticias no estan en el cache, se solicita la información a la API externa y luego se almacena con tiempo de expiración 5 segundos. Es razonable que en 5 segundos las noticias no hayan cambiado de forma sustancial.
* METAR: Mismo caso que con space news. Almacenando datos de cada estacion con tiempos de expiración independientes entre ellas.
* Useless facts: No se puede cachear la respuesta ya que debe ser siempre una respuesta aleatorias

**_Components and Connectors_**

![](https://hackmd.io/_uploads/SJTm6IdNn.png)


**_Atributos de calidad_**

**Seguridad:** Nginx beneficia la seguridad del servidor con respecto a tenerlo expuesto directamente a la red.
* Autorización: Nginx puede funcionar como proxy y regular el acceso a los servidores.

**Escalabilidad:** Al tener Nginx es relativamente fácil escalar horizontalmente efectivamente ya que se pueden agregar mas réplicas.

**Performance:**  La performance aumenta, al utilizar el cache los tiempos de espera disminuyen y el server puede atender mas request. Esto se ve reflejado en los gráficos.

**_Gráficos de los escenarios_**

* **_Gráfico escenario 6 realizando request a /metar_**
![](https://hackmd.io/_uploads/HkGyZdYNn.png)
![](https://hackmd.io/_uploads/HJ2yWOKNh.png)

*Conclusión:* Comparando los resultados contra la táctica 1:
* Esta vez no hay timeouts y el server es capaz de responder todas las requests. El response time maximo no supera el segundo y en el caso anterior superaba los 10.
* El uso del CPU fue menor, llegando a 40% comparado con el 125% del caso base.

Todo esto refleja el aumento en performance.

* **_Gráfico escenario 3 realizando request a /space_news_**
![](https://hackmd.io/_uploads/SJHQEOKNh.png)
![](https://hackmd.io/_uploads/SygV4OK4n.png)

*Conclusión:* Al igual que para /metar, tanto el response time y el consumo de recursos disminuyó. Esta vez no se generan timeouts y el tiempo de respuesta maximo no supera los 3 segundos.

### Táctica 6 - Cache active population

A la táctica anterior se le cambia la estrategia de cache:
* METAR: Cada vez que se recibe una request y la estación no esta en el cache, se pide la información al servidor y además se solicita la información de otras 5 estaciones aleatorias y se almacenan en el cache con tiempo de expiracion configurable.
* Useless facts: Se almacena una pila de facts en el cache. Por cada request recibida se extrae un fact del cache y si la cantidad de facts en la pila es menor a cierto umbral configurable, se solicitan facts al servidor externo hasta superar el umbral.
* Space news: Se mantiene la estrategia anterior (lazy).

**_Components and Connectors_**

_Ver táctica 5_.

**_Atributos de calidad_**

**Seguridad:** Nginx beneficia la seguridad del servidor con respecto a tenerlo expuesto directamente a la red.
* Autorización: Nginx puede funcionar como proxy y regular el acceso a los servidores.

**Escalabilidad:** Al tener Nginx es relativamente fácil escalar horizontalmente efectivamente ya que se pueden agregar mas réplicas.

**Performance:**  La performance varía respecto al escenario: para /fact aumenta pero para /metar disminuye, esto se analiza en las conclusiones de los gráficos.

**_Gráficos de los escenarios_**

* **_Gráfico escenario 5 realizando request a /fact_**
![](https://hackmd.io/_uploads/SJNZq_K42.png)
![](https://hackmd.io/_uploads/rkT-qOY4h.png)

*Conclusión:* Comparado con el caso base, la táctica de cache con active population resulta sumamente efectiva. Con la misma carga que termino en timeouts para el caso base, en esta táctica se responden todas las request con un response máximo de 90ms. Es interesante como se observa el pico al comienzo del escenario ya que es ahi donde se empieza a popular el cache, pero luego disminuye drásticamente y los tiempos de respuesta caen a los 25 ms.

* **_Gráfico escenario 6 realizando request a /metar_**
![](https://hackmd.io/_uploads/r1He2utEn.png)
![](https://hackmd.io/_uploads/rJl4bhOtE2.png)

*Conclusión:* Comparando con cache lazy population, la implementación de active population no fue efectiva. Se ve que la performance bajo y el uso del cpu aumento. Se identifican dos posibles causas:
* La implementación de cache active population no es eficiente en terminos algoritmicos.
* Hay muy pocas estaciones y entonces el cache con lazy population alcanza a cachearlas todas al mismo tiempo que active population pero con menos esfuerzo.

Creemos que esta táctica resultaría mas efectiva con más estaciones.

### Táctica 7 - Rate limiting + Nodos replicados + Cache (lazy)

En esta táctica, la idea es que Redis funcione como un almacenamiento compartido entre las réplicas, por lo tanto el límite no se dé por réplica sino que será el mismo para todo el servidor.

**_Components and Connectors_**

![](https://hackmd.io/_uploads/HJu5jU_4n.png)


**_Atributos de calidad_**

**Seguridad:** Nginx beneficia la seguridad del servidor con respecto a tenerlo expuesto directamente a la red.
* Autorización: Nginx puede funcionar como proxy y regular el acceso a los servidores.

**Escalabilidad:** Al tener Nginx es relativamente fácil escalar horizontalmente efectivamente ya que se pueden agregar mas réplicas.

**Performance:**  La performance aumenta, al utilizar el cache los tiempos de espera disminuyen y el server puede atender mas request.


**_Gráficos de los escenarios_**

![](https://hackmd.io/_uploads/Sy_K07VVh.png)
![](https://hackmd.io/_uploads/BJ6FRQ4Eh.png)

*Conclusión:* En este escenario, utilizando un límite de 1500 requests por cada 50s, podemos ver que éste se comparte entre los tres nodos por lo que se empiezan a limitar las requests mucho antes. Acá podemos ver una notoria diferencia con la táctica anterior, cuyo límite era de 1500 requests en cada réplica y nunca se llegaba a limitar ninguna.