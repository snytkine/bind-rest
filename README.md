Bind-Rest
==========
Annotation based framework for creating Rest APIs with Node.js with TypeScript
## BETA 0.3.X

### Installation
```
Not available at this time. Will be available when released
```
#### OR
```
// .npmrc
registry="http://ct-avs-web.es.ad.adp.com:4873/"
proxy=null
https-proxy=null
@types:registry="http://registry.npmjs.org/"

//terminal

$ npm install promiseoft --save

```

### Usage

#### CORE

##### Classes

###### Application(options)

Root class for starting application device. Call `let app= new Application({baseDir:_dirname})` in app.ts to create promiseoft application

**Options**

|Name|   |
|----|---|
|baseDir|\<string> using __dirname in this option will allow the application to scan the existing directory for named dependencies. If dependencies exist in an alternate directory, provide the relative path |
|timeout|\<number> set the number of MS to timeout a request if no response Default = 0|

**Methods**


|Name| Description  |ReturnType|
|----|---|----------|
|[init()](#appinit)| Initialize the application with options `app.init()` See Example A |Promise|


**<a name="appinit">Example A ( app.init() )</a>**

```
    app.init().then(handler  => {
        const port = 3000;
        http.createServer(handler).listen(port);
        console.log(`Server running on port ${port}.`);
    })
    .catch((e:Error) => console.error(`Container init Failed ${e} :: ${e.stack}`));
```




###### Annotations

|Annotation Name|          |Parent Annotation|
|---------------|----------|-----------------|
|<a name="predestroy">@PreDestroy</a>            | Annotation that will handle request such as closing sockets or DB connections before process terminates (similar to on unload) | ComponentFactory |
|<a name="middleware">@MiddleWare</a>            | Annotation that creates a middleware class to be handled in process thread. Loads class. Depends on Before, After, AfterController, AfterResponse Annotations to determine order of middleware on everyhttp request NOTE: this is NOT controller specific ||
|<a name="metaprops">@MetaProps</a>              |        |
|<a name="jsonschema">@JsonSchema</a>            | Annotation that will define a schema to be handled by the bodyParser. If body Controller does not match Labeled Schema, request will be rejected.      |
|<a name="init">@Init</a>                        | Annotation that identifies the function to be called when Application is initialized |ComponentFactory|
|<a name="errorhandler">@ErrorHandler</a>        | Annotation that creates a custom errorHandler. This Component will initialize with the App. Only one is allowed in the Application. All Errors will be handled by the errorHandler component then fall through to default error handler.||
|<a name="environment">@Environment</a>          | Annotation that specifies the Environment based on environment NODE_ENV value. Follow this annotation with a named Component Annotation for use in other components. Requires a default class.||
|<a name="controller">@Controller</a>            | Annotation for creating http funcitonality within the application. Using a **Path** annotation is optional. If no Path annotation is provided then controller will response to request for root url.|
|<a name="path">@Path</a>                        | Annotation that names the route of the HTTP request.|Controller<br/>|
|<a name="component">@Component</a>              | Annotation for creating reusable Classes across the application|Controller<br>ComponentFactory<br>MiddleWare|
|<a name="componentfactory">@ComponentFactory</a>| Annotation for Creating Reusable Components Application level components. Useful for connecting to an external service. Requires a default class |
|<a name="contextservice">@ContextService</a>    |        |
|<a name="inject">@Inject</a>                    | Injects a Component class into class prototype `@Inject('mycomponent') myproto`       | Controller <br> Component <br> ComponentFactory |
|<a name="GET">@GET</a>                          | Describes HTTP request method. @Path Annotation is optional. If no Path annotation is provided then \[GET,PUT,POST,DELETE,ALL\] will respond on path provided by @Controller. This annotation can be grouped with other HTTP request annotations (PUT,POST,DELETE.. ETC)| Controller|
|<a name="PUT">@PUT</a>                          | Describes HTTP request method. @Path Annotation is optional. If no Path annotation is provided then \[GET,PUT,POST,DELETE,ALL\] will respond on path provided by @Controller. This annotation can be grouped with other HTTP request annotations (PUT,POST,DELETE.. ETC)| Controller|
|<a name="POST">@POST</a>                        | Describes HTTP request method. @Path Annotation is optional. If no Path annotation is provided then \[GET,PUT,POST,DELETE,ALL\] will respond on path provided by @Controller. This annotation can be grouped with other HTTP request annotations (PUT,POST,DELETE.. ETC)| Controller|
|<a name="DELETE">@DELETE</a>                    | Describes HTTP request method. @Path Annotation is optional. If no Path annotation is provided then \[GET,PUT,POST,DELETE,ALL\] will respond on path provided by @Controller. This annotation can be grouped with other HTTP request annotations (PUT,POST,DELETE.. ETC)| Controller|
|<a name="ALL">@ALL</a>                          | Describes HTTP request method. @Path Annotation is optional. If no Path annotation is provided then \[GET,PUT,POST,DELETE,ALL\] will respond on path provided by @Controller. This annotation can be grouped with other HTTP request annotations (PUT,POST,DELETE.. ETC)| Controller|



###### Method Arguments

|Annotation Name   | Example                                |Description|
|------------------|:---------------------------------------|-----------|
|@RequestBody      |`@RequestBody body:<T>`                 | Returns the body of the request. Validate Schema by passing JsonSchems to \<T>|
|@Request          |||
|@Response         |||
|@OriginalUrl      |`@OriginalUrl path:string`              | Returns requested url string|
|@RequestMethod    |`@RequestMethod method: string`         | Returns Requested http method|
|@Headers          |`@Headers headers:<T>`                  | Returns all req headers|
|@Cookies          |||
|@UriInfo          |||
|@Context          |||
|@ContextScope     |||
|@QueryString      |`@QueryString query:string `            | Returns unparsed http query string (everything after ?)|
|@Query            |`@Query queryString: <T>`               | Returns a PARSED query string as an object|
|@PathParam        |`@PathParam("id") id: string`           | Returns path paramter "id" from request (/users/{id})|
|@QueryParam       |`@QueryParam("filter") filter: string`  | Returns query parameter "filter" from request (/users?filter='abc')|
|@HeaderParam      |`@HeaderParam("transactionId") id: <T> `| Returns header paramter "transactionId" from request if available|
|@CookieParam      |||
|@ContextScopeParam|||
|@Required         |`@QueryParam("filter") @Required filter: string`| Indicates that parameter is required. Will result in error if param not provided in request |

###### Utilities

|Method Name                                               | Example                                |Description|
|----------------------------------------------------------|:---------------------------------------|-----------|
|expressMiddlewareWrapper(express.RequestHandler\[  name ])| `let rmw= expressMiddlewareWrapper(fn,'mymiddlware')` <br> `... return rmw(ctx).then(...)` | Wraps an express method to utilize within controller|
|rejectLater( ms: number)                                  | `await rejectLater(4000).catch(noop);` | Will set delay in middleware chain. Must have a catch block.  |
|noop( args: any[] )                                       | | |

###### Errors and Responses

|Name                                            | Example                                               |Type       |
|------------------------------------------------|:------------------------------------------------------|-----------|
|AppError( msg:string [, category, type])        |`throw new AppError("error in application")`           | Constructor<br> Extends: Error|
|TypeValidationError( msg:string )               |`throw new TypeValidationError("error in application")`| Constructor<br> Extends: AppError|
|AppResponse( body[, statusCode, headers] )      || Constructor<br> implements: IAppResponse|
|JsonResponse( JSON [,httpstatusCode, headers] ) || Constructor<br> Extends: AppResponse <br> Handles streamed response|
|ErrorResponse( responseCode [, message] )       || Constructor<br> Extends: AppResponse|

###### Types References

|Type                   |
|-----------------------|
|IContext \| CoreContext|
|IContainer             |
|IAppResponse           |
|ApplicationOptions     |
|IJsonResponse<T>       |
|IContextService        |
|ControllerDetails      |


###### Enviornment Variables (Optional)

|Name               | Value                       | Description                         |
|-------------------|-----------------------------|-------------------------------------|
|DEBUG              |promiseoft:*                 | To display log output to the console|

### Examples

#### Annotations

[**PreDestroy**](#predestroy)

```javascript
@ComponentFactory
export default class myClass {

  @PreDestroy
  destructor(): Promise<any> {
    console.log(`Entered destructor on myClass Component Factory`);
    if (this.db) {
      return this.mdb.close().then(_ => {
        console.log(`MongoDB Connection Closed Successfully`)
      });
    } else {
      return Promise.resolve(true);
    }
  }
}

```

[**MiddleWare**](#middleware)

```javascript

@Middleware
export default class mymiddleware { ... }

```

[**JsonSchema**](#jsonschema)

```javascript

// schemadefinition.ts
export default {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "name": {
      "type": "string"
    "email": {
      "type": "string"
    }

  },
  "required": [
    "name",
    "email"
  ]
}

// user.ts

@JsonSchema("user")
export class User {
    name: string;
    email: string;
}
```


[**Init**](#init)

```javascript

@ComponentFactory
export default class myFactory {

  private mdb: Db;

  @Init
  init(): Promise<any> {
    console.log(`Entered myFactory.init()`);
    let self = this;
    return MongoClient.connect(url)
        .then(db => {
          console.log(`MongoDB Connection Successful`);
          self.mdb = db
        })
        .catch(e => {
          console.error(`Failed to connect to mongodb ${e.message}`);
          throw e
        })
  }
}


```

[**ErrorHandler**](#errorhandler)

```javascript

@ErrorHandler
export default class MyErrorHandler {


  @Inject('settings')
  mySettings: settings;

  handleError = (ctx: IContext) => (e) => {

    console.log(`Entered Custom Error Handler ${this.mySettings.mongoConn}`);

    throw e;
  }

}

```

[**Environment**](#environment)

```javascript

@Environment("DIT", "FIT")
@Component('settings')
export default class settings implements Isettings {

    port: "3080"
    dbConnection: "http://someuri/"

}

```

[**Controller**](#controller)

```javascript


@Controller
@Path('/myroute')
export default class myController {

  @Inject('settings')
  settings: <T>

  @GET
  @Path('/mysubroute/{id}')
  getOrders(@PathParam('id') id: number, @QueryParam('orgid') @Required orgId: string): Promise<IAppResponse> {
      try {
        return new JsonResponse({"a":a,"b":b});
      }
      catch (e){
        return new AppResponse(`Error ${e}`);
    }
}


```

[**ComponentFactory**](#conponentfactory)

```javascript


@ComponentFactory
export default class MongoConn {

  @Inject('settings')
  settings: Isettings;

  private mdb: Db;

  @Component("Foo")
  getDB(): Db {
    return this.mdb;
  }

  @Component("usercollection")
  getUserCollection(): Collection {
    return this.mdb.collection("users");
  }

  @Init
  init(): Promise<any> {
    console.log(`Entered MongoConn.init()`);
    let self = this;
    return MongoClient.connect(self.settings.mongoConn)
        .then(db => {
          console.log(`MongoDB Connection Successful`);
          self.mdb = db
        })
        .catch(e => {
          console.error(`Failed to connect to mongodb ${e.message}`);
          throw e
        })

  }

  @PreDestroy
  destructor(): Promise<any> {
    console.log(`Entered destructor on Mongodb Component Factory`);
    if (this.mdb) {
      return this.mdb.close().then(_ => {
        console.log(`MongoDB Connection Closed Successfully`)
      });
    } else {
      return Promise.resolve(true);
    }
  }
}


```
