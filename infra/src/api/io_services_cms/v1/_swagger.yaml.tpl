openapi: 3.0.3
info:
  title: IO Services CMS
  description: |-
    _This is the IO Service CMS based on the OpenAPI 3.0 specification._

    ### Some useful links:
    - [IO-SERVICES-CMS Github codebase](https://github.com/pagopa/io-services-cms)
    - [IO-SERVICES-CMS Source API definition ](https://raw.githubusercontent.com/pagopa/io-services-cms/master/apps/io-services-cms-webapp/openapi.yaml)

  contact:
    name: PagoPA S.p.A.
    url: https://docs.pagopa.it/io-guida-tecnica/
  version: 0.11.0
servers:
  - url: 'https://${host}/${basePath}'
tags:
  - name: services
    description: Services API specification
  - name: service-review
    description: Service Review API specification
  - name: service-release
    description: Service Release API specification
  - name: service-authorization
    description: Service Authorization API specification
  - name: service-topics
    description: Services thematic taxonomy
  - name: service-history
    description: Services history
paths:
  /services:
    post:
      tags:
        - services
      summary: Create a new service
      description: Create a new Service with the attributes provided in the request payload
      operationId: createService
      requestBody:
        description: A service body payload
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServicePayload'
        required: true
      responses:
        '201':
          description: Service created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServiceLifecycle'
        '400':
          description: Invalid payload
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '429':
          description: Too many requests
        '500':
          description: Internal server error
    get:
      tags:
        - services
      summary: Retrieve all services
      description: Retrieve all services owned by the calling user
      operationId: getServices
      parameters:
        - name: limit
          in: query
          description: The number of services to return
          required: false
          schema:
            type: number
            minimum: 1
            maximum: 100
            default: 20
        - name: offset
          in: query
          description: The number of services to skip before starting to collect the result set
          required: false
          schema:
            type: number
            minimum: 0
            default: 0
      responses:
        '200':
          description: Services fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServicePagination'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/topics:
    get:
      tags:
        - service-topics
      summary: Retrieve all services topic
      description: Retrieve all service topics
      operationId: getServiceTopics
      responses:
        '200':
          description: Service topics fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServiceTopicList'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /internal/services/topics:
    get:
      tags:
        - service-topics
      summary: Retrieve all topics
      description: Retrieve all services topics
      operationId: getServiceTopicsInternal
      parameters:
        - $ref: '#/components/parameters/XForwardedFor'
      responses:
        '200':
          description: Service topics fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/InternalServiceTopicList'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}:
    get:
      tags:
        - services
      summary: Retrieve service
      description: Retrieve a service by ID
      operationId: getService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      responses:
        '200':
          description: Service fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServiceLifecycle'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
    put:
      tags:
        - services
      summary: Update service
      description: Update an existing service by ID
      operationId: updateService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      requestBody:
        description: Updated service payload
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ServicePayload'
        required: true
      responses:
        '200':
          description: Service updated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServiceLifecycle'
        '400':
          description: Invalid payload
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
    delete:
      tags:
        - services
      summary: Delete service
      description: Delete a service by ID
      operationId: deleteService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      responses:
        '204':
          description: Service deleted successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}/logo:
    put:
      tags:
        - services
      summary: Upload service logo
      description: Upload service logo by service ID
      operationId: updateServiceLogo
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      requestBody:
        description: Service logo payload _(base64 string representation)_
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Logo'
        required: true
      responses:
        '204':
          description: Service logo updated successfully
        '400':
          description: Invalid payload
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}/history:
    get:
      tags:
        - service-history
      summary: Retrieve service history
      description: Retrieve service history by service ID
      operationId: getServiceHistory
      parameters:
        - name: serviceId
          in: path
          description: ID of the service
          required: true
          schema:
            type: string
        - name: order
          in: query
          description: Order direction
          required: false
          schema:
            type: string
            enum: [ASC, DESC]
            default: DESC
        - name: limit
          in: query
          description: The number of services to return
          required: false
          schema:
            type: number
            minimum: 1
            maximum: 100
            default: 10
        - name: continuationToken
          in: query
          description: Token to retrieve the next page of results
          required: false
          schema:
            type: string
      responses:
        '200':
          description: Service history retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServiceHistory'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}/keys:
    get:
      tags:
        - service-authorization
      summary: Retrieve service keys
      description: Retrieve service keys by service ID
      operationId: getServiceKeys
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      responses:
        '200':
          description: Service keys fetched successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SubscriptionKeys'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}/keys/{keyType}:
    put:
      tags:
        - service-authorization
      summary: Regenerate service key
      description: Regenerate service key by service ID and key type
      operationId: regenerateServiceKey
      parameters:
        - $ref: '#/components/parameters/ServiceId'
        - name: keyType
          in: path
          description: Key type
          required: true
          schema:
            $ref: '#/components/schemas/SubscriptionKeyType'
      responses:
        '200':
          description: Service key regenerated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SubscriptionKeys'
        '400':
          description: Bad request
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}/review:
    put:
      tags:
        - service-review
      summary: Send service to review
      description: Send service to review by service ID
      operationId: reviewService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      requestBody:
        description: Review Request option
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ReviewRequest'
        required: true
      responses:
        '204':
          description: Service revirew taken in charge
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '409':
          description: Service status is incompatible with review action request
        '429':
          description: Too many requests
        '500':
          description: Internal server error
  /services/{serviceId}/release:
    post:
      tags:
        - service-release
      summary: Publish service on IO
      description: Publish service by ID on __IO Platform__
      operationId: releaseService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      responses:
        '204':
          description: Service published successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '409':
          description: Service status is incompatible with publish action request
        '429':
          description: Too many requests
        '500':
          description: Internal server error
    get:
      tags:
        - service-release
      summary: Retrieve last published version of service
      description: Retrieve last version of service published on __IO Platform__
      operationId: getPublishedService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      responses:
        '200':
          description: Fetched published service
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ServicePublication'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
    delete:
      tags:
        - service-release
      summary: Unpublish service from IO
      description: Unpublish service by ID from __IO Platform__
      operationId: unpublishService
      parameters:
        - $ref: '#/components/parameters/ServiceId'
      responses:
        '204':
          description: Service unpublished successfully
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
        '404':
          description: Not found
        '429':
          description: Too many requests
        '500':
          description: Internal server error
components:
  parameters:
    ServiceId:
      in: path
      name: serviceId
      description: ID of the service
      required: true
      schema:
        type: string
  schemas:
    ServiceLifecycle:
      description: Service Lifecycle model data
      allOf:
        - type: object
          properties:
            id:
              type: string
            status:
              $ref: '#/components/schemas/ServiceLifecycleStatus'
            version:
              type: integer
            last_update:
              $ref: '#/components/schemas/Timestamp'
            metadata:
              $ref: '#/components/schemas/ServiceMetadata'
          required:
            - id
            - status
            - last_update
            - metadata
        - $ref: '#/components/schemas/ServiceData'
    ServicePublication:
      description: Service Publication model data
      allOf:
        - type: object
          properties:
            id:
              type: string
            status:
              $ref: '#/components/schemas/ServicePublicationStatusType'
            version:
              type: integer
            last_update:
              $ref: '#/components/schemas/Timestamp'
            metadata:
              $ref: '#/components/schemas/ServiceMetadata'
          required:
            - id
            - status
            - last_update
            - metadata
        - $ref: '#/components/schemas/ServiceData'
    ServicePayload:
      description: A payload used to create or update a service.
      allOf:
        - type: object
          properties:
            metadata:
              $ref: '#/components/schemas/ServicePayloadMetadata'
          required:
            - metadata
        - $ref: '#/components/schemas/ServiceData'
    ServiceData:
      type: object
      description: Service basic data
      properties:
        name:
          type: string
          minLength: 1
        description:
          type: string
          minLength: 1
        organization:
          $ref: '#/components/schemas/Organization'
        require_secure_channel:
          type: boolean
        authorized_recipients:
          type: array
          items:
            $ref: '#/components/schemas/FiscalCode'
        authorized_cidrs:
          description: >-
            Allowed source IPs or CIDRs for this service.
            When empty, every IP address it's authorized to call the IO API on
            behalf of the service.
          type: array
          items:
            $ref: '#/components/schemas/Cidr'
        max_allowed_payment_amount:
          type: integer
          format: int32
          minimum: 0
          maximum: 9999999999
          default: 0
      required:
        - name
        - description
        - organization
    ServiceBaseMetadata:
      type: object
      description: A set of common service metadata properties
      properties:
        web_url:
          type: string
          minLength: 1
        app_ios:
          type: string
          minLength: 1
        app_android:
          type: string
          minLength: 1
        tos_url:
          type: string
          minLength: 1
        privacy_url:
          type: string
          minLength: 1
        address:
          type: string
          minLength: 1
        phone:
          type: string
          minLength: 1
        email:
          type: string
          minLength: 1
        pec:
          type: string
          minLength: 1
        cta:
          type: string
          minLength: 1
        token_name:
          type: string
          minLength: 1
        support_url:
          type: string
          minLength: 1
        category:
          type: string
          enum: [SPECIAL, STANDARD]
        custom_special_flow:
          type: string
          minLength: 1
        scope:
          type: string
          enum: [NATIONAL, LOCAL]
      required:
        - scope
    ServiceMetadata:
      description: A set of service metadata properties
      allOf:
        - $ref: '#/components/schemas/ServiceBaseMetadata'
        - type: object
          properties:
            topic:
              $ref: '#/components/schemas/ServiceTopic'
    ServicePayloadMetadata:
      description: A set of service metadata properties on request payload
      allOf:
        - $ref: '#/components/schemas/ServiceBaseMetadata'
        - type: object
          properties:
            topic_id:
              type: number
              description: The topic id
              example: 3
          required:
            - topic_id
    ServiceLifecycleStatus:
      type: object
      properties:
        value:
          $ref: '#/components/schemas/ServiceLifecycleStatusType'
        reason:
          description: Reason for status value
          type: string
      required:
        - value
    ServiceLifecycleStatusType:
      description: |
        Service lifecycle status<br>
        - _draft_: A new draft of the service has been created, filled in completely or partially and saved by the system.
        - _submitted_: The draft has been sent for internal validation to PagoPA and the response is awaited. In this state, the service is
        immutable and is frozen in the shipped version.
        - _approved_: The service has been approved by the _PagoPA S.p.A._ internal validation process, it is correct and suitable for publication.
        - _rejected_: The service goes back to the draft but cannot be resubmitted for validation unless it is modified by the institution in
        at least one of its fields.
        - _deleted_: The service is permanently deleted from the Back-Office.
      type: string
      enum: [draft, submitted, approved, rejected, deleted]
    ServicePublicationStatusType:
      description: |
        Service publication status<br>
        - _published_: The service is visible in _IO App_ to users
        - _unpublished_: The service is no longer visible in _IO App_ to users, but remains in the institution's Back-Office, which can
        later choose to publish it again.
      type: string
      enum: [published, unpublished]
    ServicePagination:
      type: object
      properties:
        value:
          type: array
          items:
            $ref: '#/components/schemas/ServiceLifecycle'
        pagination:
          $ref: '#/components/schemas/PaginationResultSet'
    PaginationResultSet:
      type: object
      properties:
        offset:
          type: number
          description: result set offset
        limit:
          type: number
          description: result set size
        count:
          type: number
          description: total record count
    Organization:
      type: object
      properties:
        name:
          type: string
          minLength: 1
        fiscal_code:
          $ref: '#/components/schemas/OrganizationFiscalCode'
        department_name:
          type: string
          minLength: 1
      required:
        - name
        - fiscal_code
    OrganizationFiscalCode:
      type: string
      description: Organization's fiscal code.
      pattern: '^[0-9]{11}$'
      example: 012345678901
    FiscalCode:
      type: string
      description: User's fiscal code.
      pattern: '^[A-Z]{6}[0-9LMNPQRSTUV]{2}[ABCDEHLMPRST][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$'
      example: AAAAAA00A00A000A
    Logo:
      description: A base64 string representation of the logo PNG image.
      type: object
      properties:
        logo:
          type: string
          format: byte
          minLength: 1
      required:
        - logo
    SubscriptionKeys:
      type: object
      properties:
        primary_key:
          type: string
        secondary_key:
          type: string
      required:
        - primary_key
        - secondary_key
    SubscriptionKeyType:
      type: string
      enum: [primary, secondary]
    ReviewRequest:
      type: object
      properties:
        auto_publish:
          type: boolean
          description: Flag to request an automatic service publication on service approval.
          example: true
      required:
        - auto_publish
    Timestamp:
      type: string
      description: A date-time field in ISO-8601 format and UTC timezone.
      example: '2023-01-22T00:00:00.000Z'
    ServiceTopicList:
      type: object
      properties:
        topics:
          type: array
          items:
            $ref: '#/components/schemas/ServiceTopic'
    ServiceTopic:
      type: object
      properties:
        id:
          type: number
          description: The topic id
          example: 3
        name:
          type: string
          description: The topic name
          example: 'Benessere sociale'
      required:
        - id
        - name
    InternalServiceTopic:
      type: object
      properties:
        id:
          type: number
          description: The topic id
          example: 3
        name:
          type: string
          description: The topic name
          example: 'Benessere sociale'
        deleted:
          type: boolean
          description: if the topic is deleted
          example: false
      required:
        - id
        - name
        - deleted
    InternalServiceTopicList:
      type: object
      properties:
        topics:
          type: array
          items:
            $ref: '#/components/schemas/InternalServiceTopic'
    ServiceHistory:
      type: object
      description: Service basic data
      properties:
        continuationToken:
          type: string
          description: Continuation token for pagination
        items:
          type: array
          items:
            $ref: '#/components/schemas/ServiceHistoryItem'
    ServiceHistoryItem:
      description: Service History model data
      allOf:
        - type: object
          properties:
            id:
              type: string
            status:
              $ref: '#/components/schemas/ServiceHistoryItemStatus'
            version:
              type: integer
            last_update:
              $ref: '#/components/schemas/Timestamp'
            metadata:
              $ref: '#/components/schemas/ServiceMetadata'
          required:
            - id
            - status
            - last_update
            - metadata
        - $ref: '#/components/schemas/ServiceData'
    ServiceHistoryItemStatus:
      type: object
      properties:
        kind:
          $ref: '#/components/schemas/ServiceHistoryStatusKind'
        value:
          $ref: '#/components/schemas/ServiceHistoryStatusType'
        reason:
          description: Reason for status value
          type: string
      required:
        - value
    ServiceHistoryStatusKind:
      description: |
        Status kind for Service History<br>
        - publication: Indicates the status is related to a service-publication event
        - lifecycle: Indicates the status is related to a service-lifecycle event
      type: string
      enum: [publication, lifecycle]
    ServiceHistoryStatusType:
      description: |
        A Service History record contains either publication or lifecycle items, so can have a combination of Service lifecycle status and publication status<br>
      type: string
      enum: [draft, submitted, approved, rejected, deleted, published, unpublished]
    Cidr:
      type: string
      description: Describes a single IP or a range of IPs.
      pattern: ^([0-9]{1,3}[.]){3}[0-9]{1,3}(/([0-9]|[1-2][0-9]|3[0-2]))?$
  securitySchemes:
    apiKeyHeader:
      type: apiKey
      name: Ocp-Apim-Subscription-Key
      in: header
      description: The `MANAGE` api-key
    apiKeyQuery:
      type: apiKey
      name: subscription-key
      in: query
      description: The `MANAGE` api-key
security:
  - apiKeyHeader: [ ]
  - apiKeyQuery: [ ]