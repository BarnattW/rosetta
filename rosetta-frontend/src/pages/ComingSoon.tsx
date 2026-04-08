interface Props {
  title: string
  description: string
}

export default function ComingSoon({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-zinc-800 font-medium mb-1">{title}</p>
      <p className="text-sm text-zinc-400">{description}</p>
    </div>
  )
}
