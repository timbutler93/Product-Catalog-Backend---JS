# Product-Catalog-Backend---JS
A simple backend product catalog API to browse and view products, written in JS.
Currently incomplete. Uses mysql(or mariadb) to store and retrieve information. 


To install run 'npm install' in root directory.

To launch run 'node index.js' in root directory.



# Database concerns:

Database schema developed several years ago without prior database knowledge.

Some fields contain complex data types (serial number fields for used camera kits will use a semi colon to separate lens and body serial numbers)

Not truly relational (Used equipment is treated as new, where used should be linked to a new product)


These issues should be resolved over time.
