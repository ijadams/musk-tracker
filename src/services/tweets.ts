import axios from 'axios';

function query() {
  axios
    .get('https://s3.amazonaws.com/ijadams/twitter/musky.json')
    .then((res) => {
      return res;
    });
}

export async function getTweets(): Promise<any> {
  const data = await query();
  return {
    data,
  };
}
