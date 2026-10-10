"use client"
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Challenge } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Loader, Trash } from "lucide-react";
import api from "@/lib/axios";
import Script from "next/script";

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(price);

type PaymentModalData = {
    setShowPaymentModal: Dispatch<SetStateAction<boolean>>;
    setIsBuying: Dispatch<SetStateAction<boolean>>;
    challenge: Challenge;
};

const PaymentModal = ({ data }: { data: PaymentModalData }) => {
    const { setShowPaymentModal, setIsBuying, challenge } = data;
    const [disChallengeFee, setDisChallengeFee] = useState(undefined);
    const [disPlatformFee, setDisPlatformFee] = useState(undefined);
    const [disFinalPrice, setDisFinalPrice] = useState(undefined);
    const [disGst, setDisGst] = useState(undefined);
    const [disGstDiscount, setDisGstDiscoount] = useState(undefined);
    const [discountApplied, setDiscountApplied] = useState(false);

    const [disMessage, setDisMessage] = useState(undefined)


    const idempotencyKeyRef = useRef<string | null>(null);




    console.log(disChallengeFee)

    const [isApplyingDiscount, setIsApplyingDiscount] = useState(false)
    const discountCodeRef = useRef<HTMLInputElement>(null);
    const price = Number(challenge.price);
    const gst = Number(price * 0.18);

    const platformCharges = price * 0.05;
    const gstDiscount = -gst

    const finalPrice = price + gst + platformCharges + gstDiscount;



    const handleRemoveDiscountCode = async () => {

        setDisChallengeFee(undefined);
        setDisFinalPrice(undefined)
        setDisGst(undefined)
        setDisGstDiscoount(undefined)
        setDisPlatformFee(undefined)
        setDiscountApplied(false)

    }

    const handleApplyDiscount = async () => {
        setIsApplyingDiscount(true)

        const tm = setTimeout(() => setIsApplyingDiscount(false), 5000)

        const discountCode = discountCodeRef.current?.value.trim();

        try {
            const res = await api.post('/payments/discount', {
                challengeId: challenge.id,
                discountCode: discountCode
            })

            if (res.status === 200) {
                setIsApplyingDiscount(false)
                clearTimeout(tm);
            }

            if (!res.data.discountApplied) return;

            setDisChallengeFee(res.data.challengeFee)
            setDisGst(res.data.gst)
            setDisGstDiscoount(res.data.gstDiscount)
            setDisPlatformFee(res.data.platformFee)
            setDisFinalPrice(res.data.finalPrice)
            setDiscountApplied(res.data.discountApplied)

            setDisMessage(res.data.message)

            setTimeout(() => {
                setDisMessage(undefined)
            }, 3000)
            console.log(res);

        } catch (error) {
            console.error(error)
        }


    };

    const handleFinalRzpPayment = async () => {

        // const amountFinalRzp = disFinalPrice ?? finalPrice;
        // const gstRzp = disGst ?? gst;
        // const gstDiscountRzp = disGstDiscount ?? disGst;
        // const platformFeeRzp = disPlatformFee ?? platformCharges;
        // const challengeFeeRzp = disChallengeFee ?? price;
        // const dicountRzp = amountFinalRzp - finalPrice;


        function loadScript(src: string) {
            return new Promise((resolve) => {
                const script = document.createElement('script')
                script.src = src
                script.onload = () => {
                    resolve(true)
                }
                script.onerror = () => {
                    resolve(false)
                }
                document.body.appendChild(script)
            })
        }
        const scriptLoaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js")
        if (!scriptLoaded || !window.Razorpay) {
            alert("Razorpay failed to load!");
            return;
        }

        if (idempotencyKeyRef.current === null) {
            idempotencyKeyRef.current = await crypto.randomUUID()
        }



        const data = {
            challengeId: challenge.id,
            discountCode: discountCodeRef.current?.value
        }
        try {

            const resOrder = await api.post("/payments/order", data, {
                headers: {
                    "idempotency-key": idempotencyKeyRef?.current
                }
            })

            const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
            if (!key) {
                throw new Error("NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured");
            }

            if (resOrder.status == 200) {
                const data = resOrder.data
                const frontendBaseUrl = (
                    process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin
                ).replace(/\/+$/, "");
                const options = {
                    key: key,
                    amount: data.amount,
                    description: "payment for KryptoFunding simulation",
                    order_id: data.pgOrderId,
                    "callback_url": `${frontendBaseUrl}/client/dashboard/challenge/${challenge.id}`,
                    notes: {
                        idempotencyKey: idempotencyKeyRef?.current,
                        challengeId: challenge.id,
                    },
                    handler:async(res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string; } )=>{
                        api.post("/payments/capture",{
                            pgPaymentId:res.razorpay_payment_id,
                            pgOrderId:res.razorpay_order_id,
                            signature:res.razorpay_signature,
                            challengeId:challenge.id,
                            orderId:data.orderId,
                            discountTrackerId:data.discountTrackerId,
                            idempotencyKey:data.idempotencyKey

                        })
                    }
                }

                const pg = new window.Razorpay(options)

                pg.open()

            }


        } catch (error) {
            console.error(error)
        }

    }

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js"></Script>

            <Dialog
                open
                onOpenChange={(open) => {
                    setShowPaymentModal(open);
                    if (!open) setIsBuying(false);
                }}
            >
                <DialogContent className="max-h-[90vh] min-h-80  w-[calc(100%-2rem)] min-w-150 max-w-6xl overflow-y-auto border-gray-300 bg-white p-6 dark:border-[#3b353c] dark:bg-[#090909]/85">
                    <DialogHeader className="bg-[#c1cfc1]/0 w-[98%] rounded-lg h-fit mt-[-12] px-4 py-2">
                        <DialogTitle>Payment</DialogTitle>
                        <DialogDescription>
                            Complete your payment to start this challenge.
                        </DialogDescription>
                    </DialogHeader>

                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-[#c1cfc1]">
                            {challenge.title}
                        </h2>
                        <div className="flex-col w-full p-2 mt-2 border border-[#83836a] rounded-lg">
                            <RowCard text={"challenge fee"} num={price} disNum={disChallengeFee} />

                            <RowCard text={"Platform charges"} num={platformCharges} disNum={disPlatformFee} />

                            <RowCard text={"G.S.T ( 18 % ) "} num={gst} disNum={disGst} />


                            <RowCard text="We're small project, can't charge gst" num={gstDiscount} disNum={disGstDiscount} />

                            <div className="mt-3 flex gap-2 items-center  p-2">
                                <label className="mb-2 min-w-fit block text-sm font-medium text-gray-700 dark:text-[#c1cfc1]">
                                    Discount code
                                </label>


                                <div className="flex-1 items-center flex gap-2 justify-end" >

                                    {discountApplied && <Trash onClick={() => handleRemoveDiscountCode()} size={30} className="bg-amber-400/10 p-1 text-red-300 rounded-lg" />}

                                    <input
                                        type="text"
                                        ref={discountCodeRef}
                                        className="w-[60%] rounded-md border uppercase border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-gray-500 dark:border-[#3b353c] dark:bg-[#090909]/40 dark:text-[#c1cfc1]"
                                        placeholder="Enter code"
                                        disabled={discountApplied}
                                    />
                                </div>
                                <Button className="min-w-20" onClick={handleApplyDiscount} > {isApplyingDiscount ? <Loader className="animate-spin" /> : "Apply"} </Button>
                            </div>

                        </div>

                        <div className="flex text-xl w-full justify-between p-2 mt-4 border border-green-200/40 rounded-lg">
                            <div>Final Amount to pay</div>
                            {disFinalPrice !== undefined ?
                                <div className="flex gap-2" >
                                    <del>
                                        <div>{formatPrice(finalPrice)}</div>
                                    </del>
                                    <div>{formatPrice(disFinalPrice)}</div>
                                </div>
                                :
                                <div className="flex gap-2" >{formatPrice(finalPrice)}</div>
                            }
                        </div>

                        <div className="flex justify-end mt-4 ">

                            <Button className="font-bold text-xl bg-[#c1cfc1] "
                                onClick={handleFinalRzpPayment}
                            >
                                Pay Now
                            </Button>

                        </div>

                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

type RowCardType = {
    text: string;
    num: number;
    disNum?: number;
};

const RowCard = (props: RowCardType) => {
    const { text, num, disNum } = props;

    return (
        <div className="flex w-full justify-between p-2 border-b border-[#c1cfc1]/50 my-2">
            <div className="max-w-[50%]">{text}</div>
            {disNum !== undefined && disNum !== num ? <div className="flex gap-2"><del>{formatPrice(num)}</del> <p>{formatPrice(disNum)}</p></div> : <div>{formatPrice(num)}</div>}
        </div>
    );
};


export default PaymentModal;
