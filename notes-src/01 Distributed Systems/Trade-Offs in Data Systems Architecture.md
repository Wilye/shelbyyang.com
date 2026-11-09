Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems by Martin Kleppmann
***
It has become normal for data to be stored in a ==shared server-based infrastructure==.
- data from user activity, devices, sensors, etc. need to be stored and made available for analysis
- as users interact with an application, they both **read the data** that is stored and **generate more data**

> [!info] As data volume or rate of queries grows, it needs to be **distributed** across multiple machines.

==Data intensive==: if data management is one of the primary challenges in developing the application
- worry more about storing and processing large data volumes, managing changes to data, ensuring **consistency and availability**
==Compute intensive==: challenge is parallelizing a very large computation

<u>Common building blocks amongst applications</u>
- store data so that they, or another application, can find it again later (**databases**)
- remember the result of an expensive operation, to speed up reads (**caches**)
- allow users to search data by keyword or filter it in various ways (**search indexes**)
- handle events and data changes as soon as they occur (**stream processing**)
- periodically crunch a large amount of accumulated data (**batch processing**)

We will learn about the **tradeoffs** between different options (various approaches to caching, or database systems, etc.)

#### Frontend vs Backend
For web application...
- ==frontend==: the client side code (which runs in a web browser) is called the frontend
	- sometimes manage data locally on the user's device
- ==backend==: the server side code that handles user requests
	- manages data on behalf of ALL users
A backend service is often reachable via HTTP or WebSocket
- usually consists of:
	1. application code that reads and writes data in one or more databases
	2. sometimes interfaces with additional data systems (caches, message queues)
	3. often **stateless** (when it finishes handling one HTTP request, it forgets everything about that request)
		- any info that needs to persist needs to be stored on the client or server side data infrastructure

### Operational vs Analytical Systems
==Backend engineers==: build services that handle requests for reading and updating data
==Business Analysts==: generate reports about the activities of the organization to help management make better decisions (BI: business intelligence)
==Data Scientists==: look for novel insights in data or create user facing product features that are enabled by data analysis and ML
- "people who bought X also bought Y"
- predictive analytics
- ranking of search results

Business analysts and data scientists both look at the data that users and backend services have generated, and generally do not modify this data.


==Operational Systems==: backend services and data infrastructure where data is created
- application code both reads and modifies the data in its databases, based on actions performed by the users
==Analytical Systems==: serves the needs of business analysts and data scientists
- contain a read only copy of the data from the operational systems, optimized for data processing

> [!info] These two systems are often kept separate for good reasons.

Page 29/673




