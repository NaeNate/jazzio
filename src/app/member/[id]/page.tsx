import { db } from "@/lib/firebase"
import { cap } from "@/utils/client"
import { protect } from "@/utils/server"
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore"
import { revalidatePath } from "next/cache"
import { notFound, redirect } from "next/navigation"

interface Props {
  params: Promise<{ id: string }>
}

export default async function Member({ params }: Props) {
  const { id } = await params
  await protect()

  const member = await getDoc(doc(db, "members", id))
  if (!member.exists()) notFound()

  const {
    idType,
    idNumber,
    nameFirst,
    nameFather,
    nameGrandfather,
    mobileNumber,
    dateOfBirth,
    comments,
  } = member.data()!

  const visits = await getDocs(
    query(
      collection(db, "visits"),
      where("member", "==", member.id),
      where("timestamp", ">=", Date.now() - 1000 * 60 * 60 * 5),
    ),
  )

  return (
    <>
      <h1>
        {cap(nameFirst)} {cap(nameFather)} {cap(nameGrandfather)}
      </h1>

      <div className="flex flex-col gap-3">
        <p className="input text-xl">
          {idType}: {idNumber}
        </p>

        <p className="input text-xl">Mobile: {mobileNumber}</p>
        <p className="input text-xl">Date of Birth: {dateOfBirth}</p>

        <button
          onClick={async () => {
            "use server"

            if (visits.empty) {
              await addDoc(collection(db, "visits"), {
                member: id,
                timestamp: Date.now(),
              })
            }

            redirect("/search")
          }}
          className="button h-20 text-xl"
        >
          Sign In
        </button>
      </div>

      <form
        action={async (fd) => {
          "use server"

          const nc = (fd.get("comments") as string).trim()

          if (nc !== comments) {
            await updateDoc(doc(db, "members", id), { comments: nc })
            revalidatePath("/member/" + id)
          }
        }}
        className="mt-3 flex flex-col gap-3"
      >
        <textarea
          name="comments"
          defaultValue={comments}
          placeholder="Comments"
          className="input border-secondary h-40 text-xl"
        />

        <button className="button bg-secondary h-12 text-lg">
          Submit Comment
        </button>
      </form>
    </>
  )
}
