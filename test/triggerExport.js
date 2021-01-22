require('dotenv').config()
var http = require('http')
describe("Trigger an export", function () {
  it("Exports a design from the localhost, as if the user clicked on the Build mode button", function (done) {
    this.timeout(8000)
    httpOptions = {
      hostname: "localhost",
      port: 5000,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user_id': process.env.USER_ID,
        'api_key_public': process.env.API_KEY,
      },
      path: `/dev/export`
    }
    console.log(httpOptions)
    var responseData = ""
    var postData = {
      domain: process.env.DOMAIN,
      deviceToExport: undefined,
      welcomePathId: process.env.WELCOME_PATH_ID,
      designId: process.env.CONVERSATION_ID,
      callbackUrl: '/customIntegrations/exportCompleted'
    }
    const req = http.request(httpOptions, (res) => {
      console.log(`STATUS: ${res.statusCode}`);
      if (res.statusCode != 200) {
        //return done(res.statusCode)
      }
      console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        responseData += chunk
      });
      res.on('end', () => {
        if (!res.complete) {
          done(new Error('The connection was terminated while the message was still being sent'))
        } else {
          //console.log(responseData) // Log your response here
          done()
        }
      });
    });
    req.write(JSON.stringify(postData));
    req.on('error', (e) => {
      console.log("There was an error in the request")
      console.log(e)
    });
    req.end();
  })
})