// ! k6 無法直接測試 socketio，需要使用套件 Artillery 運行 socketio-test.yml 來測試 (artillery run test/socketio-test.yml)

// import http from "k6/http";
// import { check, sleep } from "k6";

// export let options = {
//   vus: 1, // Number of virtual users
//   duration: "10s", // Duration of the test
// };

// export default function () {
//   const url = "http://localhost:3000/vote/1";

//   const params = {
//     headers: {
//       "Content-Type": "application/json",
//     },
//   };

//   let res = http.post(
//     url,
//     JSON.stringify({
//       optionId: "1",
//       voterName: "測試人員",
//     }),
//     params
//   );

//   check(res, {
//     "status is 200": (r) => r.status === 200,
//     "response success": (r) => JSON.parse(r.body).success === true,
//   });

//   sleep(1); // Simulate a wait time between requests
// }
