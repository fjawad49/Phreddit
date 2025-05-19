const axios = require('axios'); 
// Must start terminal
test("server listens on port 8000", async () => {
  var res;
  try{
    res = await axios.post('http://localhost:8000/login');
    console.log(res)
  }catch(err){
    expect(err.response.status).toBe(400)
  }
});
