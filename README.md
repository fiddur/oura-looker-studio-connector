Oura Looker Studio Connector
============================

Looker Studio, previously Google Datastudio.

This is a small hobby project for my own needs, I provide no guarantees of suitability etc.

Fetching data from [Oura API](https://cloud.ouraring.com/v2/docs) for
presentation in [Looker Studio](https://lookerstudio.google.com/).


Using the connector
-------------------

You can use this [direct link to the data
source](https://datastudio.google.com/datasources/create?connectorId=AKfycbxSwp4YexfeMWw_dY2-KcD1-K81s190NtWlgBvL0J6qmaDsNMZWBBxQh7g-GPugmmW5pA&authuser=0)
and add that to your Looker Studio project.


Installing your own
-------------------

Probably incomplete list, I did a lot of trial and terror in inital setup...

1. Make sure you have pnpm and clone of this repo.
2. `pnpm i` to install all deps.
3. `npx @google/clasp login` to login.
4. `npm @google/clasp create` to setup your apps script. (or make a .clasp.json manually)
5. `pnpm push` to push the scripts.
6. `pnpm try_latest` to try it out.


Privacy Policy
--------------

Using the linked data studio connector, it will be run in my personal
Google Apps Scripts.  For the Production builds, I do not gather any
data nor logging except for exceptions thrown, for debugging purposes
only.

Also see the privacy policy for [Google Looker](https://www.looker.com/trust-center/privacy/policy/).


License and Terms of Service (ISC)
----------------------------------

Copyright 2023 Fredrik Liljegren

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
