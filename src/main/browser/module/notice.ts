import clc from 'cli-color'

type NoticeType = 'warning' | 'error' | 'info' | 'success'

export const notice = ({
  message = '',
  type = 'warning'
}: {
  message?: string
  type?: NoticeType
}) => {
  switch (type) {
    case 'warning':
      console.log(clc.yellow(`[WARNING] [Me_BROWSER] | ${message}`))
      break
    case 'error':
      console.log(clc.red(`[ERROR] [Me_BROWSER] | ${message}`))
      break
    case 'info':
      console.log(clc.blue(`[INFO] [Me_BROWSER] | ${message}`))
      break
    case 'success':
      console.log(clc.green(`[SUCCESS] [Me_BROWSER] | ${message}`))
      break
    default:
      console.log(clc.yellow(`[WARNING] [Me_BROWSER] | ${message}`))
      break
  }
  return true
}
