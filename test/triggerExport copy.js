require('dotenv').config()
var http = require('http')
describe("Trigger an export in staging", function () {
  it("Exports a design from the localhost, as if the user clicked on the Build mode button in staging", function (done) {
    this.timeout(80000)
    httpOptions = {
      hostname: "localhost",
      port: 5000,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user_id': '5b17b69d747e93000c4dce34',
        'api_key_public': 'f43032bcadd94167b78428cff2c2c5c7',
      },
      path: `/dev/export`
    }
    var responseData = ""
    var postData = {
      domain: "staging.botsociety.io",
      deviceToExport: undefined,
      welcomePathId: process.env.WELCOME_PATH_ID,
      designId: '5f3b073bfbee1a5d5d87ad9f',
      callbackUrl: '/customIntegrations/exportCompleted'
    }
    const req = http.request(httpOptions, (res) => {
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData += chunk
      });
      res.on('end', (d) => {
        if (!res.complete) {
          done(new Error('The connection was terminated while the message was still being sent'))
        } else {
          console.log(`STATUS: ${res.statusCode}`);
          if (res.statusCode != 200) {
            //return done(res.statusCode)
            console.log(res.info)
            //done(res.statusCode)
          } else {
            done()
          }
        }
      });
    });
    req.write(JSON.stringify(postData));
    req.on('error', (e) => {
      console.log("There was an error in the request")
      console.log(e)
      //done(e)
    });
    req.end();
  })
})