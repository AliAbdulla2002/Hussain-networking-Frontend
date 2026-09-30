const BASE_URL = `${import.meta.env.VITE_BACK_END_SERVER_URL}/admin`

const getDashboardStats = async () => {
  try {
    const res = await fetch(`${BASE_URL}/stats`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

export { getDashboardStats }