import { db } from "@/lib/firebase"
import { cap } from "@/utils/client"
import { protect } from "@/utils/server"
import {
  getDocs,
  query,
  collection,
  where,
  doc,
  getDoc,
} from "firebase/firestore"
import Link from "next/link"

interface Props {
  params: Promise<{ year: string; month: string; day: string }>
}

export default async function Day({ params }: Props) {
  const { year, month, day } = await params
  await protect()

  const date = new Date(`${year}-${month}-${day}`)

  const visits = await getDocs(
    query(
      collection(db, "visits"),
      where("timestamp", ">=", date.getTime()),
      where("timestamp", "<=", date.getTime() + 1000 * 60 * 60 * 24),
    ),
  )

  const members = await Promise.all(
    visits.docs.map((visit) => {
      const data = visit.data()
      return getDoc(doc(db, "members", data.member))
    }),
  )

  return (
    <>
      <h1>
        {Intl.DateTimeFormat("en-us", {
          month: "long",
          day: "numeric",
          year: "numeric",
        }).format(date)}
      </h1>

      <p>Attendance: {members.length}</p>
      <div>
        {members.map((member) => {
          const { nameFirst, nameFather, nameGrandfather } = member.data()!

          return (
            <Link href={"/member/" + member.id} key={member.id}>
              {cap(nameFirst)} {cap(nameFather)} {cap(nameGrandfather)}
            </Link>
          )
        })}
      </div>
    </>
  )
}
