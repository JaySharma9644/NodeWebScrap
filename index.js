const express = require('express')
const bodyparser = require('body-parser')
const cheerio = require('cheerio');
const path = require('path');
const cors = require('cors');
const PORT = process.env.PORT || 3000;
const zlib = require('zlib');
const app = express();
const corsOptions = {
  origin: '*',
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200,
}
// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

app.use(cors(corsOptions)); // Use this after the variable declaration
app.use(express.static('./public'));
app.use(bodyparser.json());
app.use(
  bodyparser.urlencoded({
    extended: true,
  }),
);

app.use(express.static(path.join(__dirname, 'client/build')))

app.post('/api/process', async (req, res) => {

  var data = [];
  req.addListener("data", function (chunk) {
    data.push(new Buffer(chunk));
  });
  req.addListener("end", function () {
    buffer = Buffer.concat(data);
    zlib.inflate(buffer, async function (err, result) {
      if (!err) {
        req.body = result.toString();
        // console.log("req body",  req.body)
        let list_data =   JSON.parse(req.body);
        let promises = [];
        if (list_data && list_data.length > 0) {
          list_data.map((element) => {
            let promise = new Promise(async (resolve, reject) => {
              try {
                const response = await fetch(element["Link"])
                // console.log(response)
                if (response) {
                  const body = await response.text();
                  const $ = cheerio.load(body);
                  let transporter_name = $('#lbltransporter').text();
                  element["Transporter"] = transporter_name;
                  //console.log(transporter_name);
                  resolve(transporter_name);
                }
              } catch (error) {
                
                console.log(error)
                element["Transporter"]="";
                resolve(error);
              }
              
            });
            promises.push(promise);
          });

          let result = await Promise.all(promises);
        } else {
          list_data = [];
        }

        res.json(list_data);
      
      } else {
        res.json({status:false,message:'Processing failed'});
      }
    });
  });


})

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});
app.get("/api/home", (req, res) => {
  res.json({ message: "Hello from server!" });
});
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});